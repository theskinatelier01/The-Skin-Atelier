"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { C, DEFAULT_BRANCH_ID } from "@/lib/firebase/collections";
import { requirePermission } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { expenseSchema, fieldErrors, invoiceSchema, paymentSchema } from "@/lib/validation/schemas";
import { getSettings } from "@/lib/cms/queries";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import type { Invoice, InvoiceLine, InvoiceStatus } from "@/types";

/**
 * Billing and payments.
 *
 * Money is only ever moved inside a transaction: an invoice and its stock
 * deductions are written together, and a payment and the invoice balance it
 * changes are written together. An invoice is never deleted — it is voided,
 * leaving the trail intact.
 */

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

async function nextInvoiceNumber(prefix: string): Promise<string> {
  const ref = adminDb().collection(C.counters).doc("invoices");
  const value = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const next = ((snap.data()?.value as number | undefined) ?? 0) + 1;
    tx.set(ref, { value: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return next;
  });
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(value).padStart(4, "0")}`;
}

/** Line maths in one place, so the POS preview and the stored invoice agree. */
export async function calculateTotals(
  lines: Omit<InvoiceLine, "total">[],
): Promise<{ lines: InvoiceLine[]; subtotal: number; discountTotal: number; taxTotal: number; total: number }> {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const priced = lines.map((line) => {
    const gross = line.quantity * line.unitPrice;
    const discount = Math.min(line.discount ?? 0, gross);
    const net = gross - discount;
    const tax = net * ((line.taxRate ?? 0) / 100);

    subtotal += gross;
    discountTotal += discount;
    taxTotal += tax;

    return { ...line, total: Math.round((net + tax) * 100) / 100 };
  });

  return {
    lines: priced,
    subtotal: round(subtotal),
    discountTotal: round(discountTotal),
    taxTotal: round(taxTotal),
    total: round(subtotal - discountTotal + taxTotal),
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

function statusFor(total: number, paid: number): InvoiceStatus {
  if (paid <= 0) return "Unpaid";
  if (paid >= total) return "Paid";
  return "Partially Paid";
}

/* -------------------------------------------------------------------------- */
/* Invoices                                                                    */
/* -------------------------------------------------------------------------- */

export async function createInvoice(input: {
  patientId: string;
  lines: Omit<InvoiceLine, "total">[];
  appointmentId?: string;
  notes?: string;
  branchId?: string;
  /** Optional immediate payment, as taken at the counter. */
  payment?: { amount: number; method: string; reference?: string };
}): Promise<ActionResult & { invoiceId?: string; invoiceNumber?: string }> {
  try {
    const ctx = await requirePermission("invoices.write");

    const parsed = invoiceSchema.safeParse({
      patientId: input.patientId,
      lines: input.lines,
      appointmentId: input.appointmentId,
      notes: input.notes,
      branchId: input.branchId ?? DEFAULT_BRANCH_ID,
    });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const settings = await getSettings();
    const patientSnap = await adminDb().collection(C.patients).doc(input.patientId).get();
    if (!patientSnap.exists) return { ok: false, message: "Patient not found." };

    const patient = patientSnap.data() as { fullName: string; phone: string; stats?: { totalVisits: number; totalSpend: number; outstandingBalance: number } };

    const totals = await calculateTotals(parsed.data.lines as Omit<InvoiceLine, "total">[]);
    const invoiceNumber = await nextInvoiceNumber(settings.invoicePrefix || "TSA");
    const amountPaid = round(Math.min(input.payment?.amount ?? 0, totals.total));
    const balance = round(totals.total - amountPaid);

    const invoiceRef = adminDb().collection(C.invoices).doc();

    await adminDb().runTransaction(async (tx) => {
      /* --- Reads first: Firestore requires all reads before any write. ----- */
      const productLines = totals.lines.filter((l) => l.kind === "product");
      const batchesByProduct = new Map<string, FirebaseFirestore.QueryDocumentSnapshot[]>();

      for (const line of productLines) {
        // FEFO: consume the batch that expires soonest.
        const batchSnap = await tx.get(
          adminDb()
            .collection(C.inventoryBatches)
            .where("productId", "==", line.refId)
            .where("quantityRemaining", ">", 0)
            .orderBy("quantityRemaining")
            .orderBy("expiryDate")
            .limit(10),
        );
        batchesByProduct.set(line.refId, batchSnap.docs);
      }

      const productDocs = new Map<string, FirebaseFirestore.DocumentSnapshot>();
      for (const line of productLines) {
        productDocs.set(
          line.refId,
          await tx.get(adminDb().collection(C.products).doc(line.refId)),
        );
      }

      /* --- Writes ---------------------------------------------------------- */
      tx.set(invoiceRef, {
        branchId: parsed.data.branchId,
        invoiceNumber,
        patientId: input.patientId,
        patientName: patient.fullName,
        patientPhone: patient.phone,
        date: Timestamp.now(),
        lines: totals.lines,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        amountPaid,
        balance,
        status: statusFor(totals.total, amountPaid),
        appointmentId: input.appointmentId ?? null,
        cashierId: ctx.uid,
        cashierName: ctx.email ?? ctx.uid,
        notes: input.notes ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (amountPaid > 0 && input.payment) {
        tx.set(adminDb().collection(C.payments).doc(), {
          branchId: parsed.data.branchId,
          invoiceId: invoiceRef.id,
          invoiceNumber,
          patientId: input.patientId,
          patientName: patient.fullName,
          amount: amountPaid,
          method: input.payment.method,
          date: Timestamp.now(),
          reference: input.payment.reference ?? null,
          receivedBy: ctx.uid,
          receivedByName: ctx.email ?? ctx.uid,
          isRefund: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Deduct sold stock, oldest-expiring batch first.
      for (const line of productLines) {
        let remaining = line.quantity;
        const product = productDocs.get(line.refId);
        const productData = product?.data() as
          | { currentStock: number; minimumStock: number; unit: string; name: string }
          | undefined;
        if (!productData) continue;

        const batches = (batchesByProduct.get(line.refId) ?? []).sort((a, b) => {
          const ax = a.data().expiryDate?.toMillis?.() ?? 0;
          const bx = b.data().expiryDate?.toMillis?.() ?? 0;
          return ax - bx;
        });

        for (const batch of batches) {
          if (remaining <= 0) break;
          const available = (batch.data().quantityRemaining as number) ?? 0;
          const take = Math.min(available, remaining);
          remaining -= take;

          tx.update(batch.ref, {
            quantityRemaining: available - take,
            status: available - take <= 0 ? "Depleted" : "Active",
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        const newStock = productData.currentStock - line.quantity;
        tx.update(adminDb().collection(C.products).doc(line.refId), {
          currentStock: newStock,
          // Denormalised so the low-stock badge can be a single indexed query.
          isLowStock: newStock <= productData.minimumStock,
          updatedAt: FieldValue.serverTimestamp(),
        });

        tx.set(adminDb().collection(C.stockMovements).doc(), {
          branchId: parsed.data.branchId,
          productId: line.refId,
          productName: productData.name,
          type: "SALE",
          quantity: -line.quantity,
          balanceAfter: newStock,
          unit: productData.unit,
          reference: invoiceNumber,
          referenceType: "Invoice",
          performedBy: ctx.uid,
          performedByName: ctx.email ?? ctx.uid,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Roll the patient's denormalised totals forward.
      const stats = patient.stats ?? { totalVisits: 0, totalSpend: 0, outstandingBalance: 0 };
      tx.update(adminDb().collection(C.patients).doc(input.patientId), {
        stats: {
          totalVisits: stats.totalVisits + 1,
          totalSpend: round(stats.totalSpend + amountPaid),
          outstandingBalance: round(stats.outstandingBalance + balance),
          lastVisitAt: Timestamp.now(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (input.appointmentId) {
        tx.update(adminDb().collection(C.appointments).doc(input.appointmentId), {
          invoiceId: invoiceRef.id,
          paymentStatus: statusFor(totals.total, amountPaid),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    await writeAuditLog(ctx, {
      action: "invoice.create",
      module: "Finance",
      entityId: invoiceRef.id,
      entityLabel: `${invoiceNumber} · ${patient.fullName}`,
      after: { total: totals.total, amountPaid, lines: totals.lines.length },
      branchId: parsed.data.branchId,
    });

    revalidatePath("/admin/clinic/invoices");
    revalidatePath("/admin/clinic/front-desk");
    return { ok: true, message: `Invoice ${invoiceNumber} created.`, invoiceId: invoiceRef.id, invoiceNumber };
  } catch (error) {
    return toActionResult(error, "The invoice could not be created.");
  }
}

export async function recordPayment(input: {
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  isRefund?: boolean;
}): Promise<ActionResult> {
  try {
    const ctx = await requirePermission(input.isRefund ? "invoices.void" : "payments.write");

    const parsed = paymentSchema.safeParse({ ...input, branchId: DEFAULT_BRANCH_ID });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const invoiceRef = adminDb().collection(C.invoices).doc(input.invoiceId);

    const result = await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(invoiceRef);
      if (!snap.exists) return { error: "Invoice not found." };

      const invoice = snap.data() as Invoice;
      if (invoice.status === "Void") return { error: "This invoice has been voided." };

      const delta = input.isRefund ? -input.amount : input.amount;
      const newPaid = round(invoice.amountPaid + delta);

      if (!input.isRefund && newPaid > invoice.total) {
        return {
          error: `That exceeds the balance. ${invoice.balance.toFixed(0)} remains outstanding.`,
        };
      }
      if (input.isRefund && input.amount > invoice.amountPaid) {
        return { error: "A refund cannot exceed the amount paid." };
      }

      const newBalance = round(invoice.total - newPaid);

      tx.update(invoiceRef, {
        amountPaid: newPaid,
        balance: newBalance,
        status: input.isRefund && newPaid === 0 ? "Refunded" : statusFor(invoice.total, newPaid),
        refundedAmount: input.isRefund
          ? round((invoice.refundedAmount ?? 0) + input.amount)
          : (invoice.refundedAmount ?? 0),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(adminDb().collection(C.payments).doc(), {
        branchId: invoice.branchId,
        invoiceId: input.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        patientId: invoice.patientId,
        patientName: invoice.patientName,
        amount: input.amount,
        method: input.method,
        date: Timestamp.now(),
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        receivedBy: ctx.uid,
        receivedByName: ctx.email ?? ctx.uid,
        isRefund: Boolean(input.isRefund),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Keep the patient's outstanding balance in step.
      const patientRef = adminDb().collection(C.patients).doc(invoice.patientId);
      const patientSnap = await tx.get(patientRef);
      if (patientSnap.exists) {
        const stats = (patientSnap.data()?.stats ?? {}) as {
          totalSpend?: number;
          outstandingBalance?: number;
        };
        tx.update(patientRef, {
          "stats.totalSpend": round((stats.totalSpend ?? 0) + delta),
          "stats.outstandingBalance": round(
            Math.max(0, (stats.outstandingBalance ?? 0) - delta),
          ),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return { invoiceNumber: invoice.invoiceNumber };
    });

    if ("error" in result) return { ok: false, message: result.error };

    await writeAuditLog(ctx, {
      action: input.isRefund ? "payment.refund" : "payment.record",
      module: "Finance",
      entityId: input.invoiceId,
      entityLabel: result.invoiceNumber,
      after: { amount: input.amount, method: input.method },
    });

    revalidatePath(`/admin/clinic/invoices/${input.invoiceId}`);
    revalidatePath("/admin/clinic/invoices");
    return { ok: true, message: input.isRefund ? "Refund recorded." : "Payment recorded." };
  } catch (error) {
    return toActionResult(error, "The payment could not be recorded.");
  }
}

export async function voidInvoice(invoiceId: string, reason: string): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("invoices.void");
    if (!reason.trim()) return { ok: false, message: "A reason is required to void an invoice." };

    const ref = adminDb().collection(C.invoices).doc(invoiceId);
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, message: "Invoice not found." };

    const invoice = snap.data() as Invoice;

    await ref.update({
      status: "Void",
      voidedReason: reason,
      balance: 0,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: ctx.uid,
    });

    await writeAuditLog(ctx, {
      action: "invoice.void",
      module: "Finance",
      entityId: invoiceId,
      entityLabel: invoice.invoiceNumber,
      before: { status: invoice.status, total: invoice.total },
      after: { status: "Void", reason },
    });

    revalidatePath("/admin/clinic/invoices");
    return { ok: true, message: `Invoice ${invoice.invoiceNumber} voided.` };
  } catch (error) {
    return toActionResult(error, "The invoice could not be voided.");
  }
}

/* -------------------------------------------------------------------------- */
/* Expenses                                                                    */
/* -------------------------------------------------------------------------- */

export async function createExpense(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("expenses.write");

    const parsed = expenseSchema.safeParse({
      title: formData.get("title"),
      category: formData.get("category"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      method: formData.get("method"),
      vendor: formData.get("vendor") || undefined,
      notes: formData.get("notes") || undefined,
      branchId: formData.get("branchId") ?? DEFAULT_BRANCH_ID,
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const ref = await adminDb()
      .collection(C.expenses)
      .add({
        ...parsed.data,
        date: Timestamp.fromDate(new Date(parsed.data.date)),
        recordedBy: ctx.uid,
        recordedByName: ctx.email ?? ctx.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    await writeAuditLog(ctx, {
      action: "expense.create",
      module: "Finance",
      entityId: ref.id,
      entityLabel: parsed.data.title,
      after: { amount: parsed.data.amount, category: parsed.data.category },
      branchId: parsed.data.branchId,
    });

    revalidatePath("/admin/finance/expenses");
    return { ok: true, message: "Expense recorded." };
  } catch (error) {
    return toActionResult(error, "The expense could not be recorded.");
  }
}
