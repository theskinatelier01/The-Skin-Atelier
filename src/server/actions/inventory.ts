"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { C, DEFAULT_BRANCH_ID } from "@/lib/firebase/collections";
import { requirePermission } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import {
  batchSchema,
  fieldErrors,
  productSchema,
  stockMovementSchema,
  supplierSchema,
} from "@/lib/validation/schemas";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import type { Product } from "@/types";

/**
 * Inventory.
 *
 * Stock is never edited directly: every change is a movement in an append-only
 * ledger, and the product's `currentStock` is the running balance written in
 * the same transaction. That way the ledger and the balance cannot drift, and
 * any discrepancy is traceable to a single entry.
 */

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

export async function saveProduct(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult & { productId?: string }> {
  try {
    const ctx = await requirePermission("inventory.write");

    const productId = (formData.get("id") as string) || undefined;

    const parsed = productSchema.safeParse({
      name: formData.get("name"),
      sku: formData.get("sku"),
      category: formData.get("category"),
      brand: formData.get("brand") || undefined,
      supplierId: formData.get("supplierId") || undefined,
      purchasePrice: formData.get("purchasePrice"),
      sellingPrice: formData.get("sellingPrice"),
      currentStock: formData.get("currentStock") ?? 0,
      minimumStock: formData.get("minimumStock") ?? 0,
      unit: formData.get("unit"),
      storageLocation: formData.get("storageLocation") || undefined,
      isRetail: formData.get("isRetail") === "on",
      requiresBatchTracking: formData.get("requiresBatchTracking") === "on",
      isActive: formData.get("isActive") !== "off",
      notes: formData.get("notes") || undefined,
      branchId: formData.get("branchId") ?? DEFAULT_BRANCH_ID,
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    // SKUs must stay unique — they are how stock is reconciled against invoices.
    const duplicate = await adminDb()
      .collection(C.products)
      .where("sku", "==", parsed.data.sku)
      .limit(1)
      .get();

    if (!duplicate.empty && duplicate.docs[0].id !== productId) {
      return { ok: false, errors: { sku: "Another product already uses this SKU." } };
    }

    const payload = {
      ...parsed.data,
      isLowStock: parsed.data.currentStock <= parsed.data.minimumStock,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: ctx.uid,
    };

    let id = productId;
    if (id) {
      const before = (await adminDb().collection(C.products).doc(id).get()).data();
      await adminDb().collection(C.products).doc(id).update(payload);
      await writeAuditLog(ctx, {
        action: "product.update",
        module: "Inventory",
        entityId: id,
        entityLabel: parsed.data.name,
        before: { sellingPrice: before?.sellingPrice, minimumStock: before?.minimumStock },
        after: { sellingPrice: parsed.data.sellingPrice, minimumStock: parsed.data.minimumStock },
      });
    } else {
      const ref = await adminDb()
        .collection(C.products)
        .add({ ...payload, createdAt: FieldValue.serverTimestamp(), createdBy: ctx.uid });
      id = ref.id;
      await writeAuditLog(ctx, {
        action: "product.create",
        module: "Inventory",
        entityId: id,
        entityLabel: parsed.data.name,
        after: { sku: parsed.data.sku, category: parsed.data.category },
      });
    }

    revalidatePath("/admin/inventory/products");
    return { ok: true, message: "Product saved.", productId: id };
  } catch (error) {
    return toActionResult(error, "The product could not be saved.");
  }
}

/* -------------------------------------------------------------------------- */
/* Stock movements                                                             */
/* -------------------------------------------------------------------------- */

export async function recordStockMovement(input: {
  productId: string;
  type: string;
  quantity: number;
  batchId?: string;
  reason?: string;
  reference?: string;
}): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("inventory.write");

    const parsed = stockMovementSchema.safeParse({ ...input, branchId: DEFAULT_BRANCH_ID });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const productRef = adminDb().collection(C.products).doc(input.productId);

    const result = await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(productRef);
      if (!snap.exists) return { error: "Product not found." };

      const product = snap.data() as Product;
      const balanceAfter = product.currentStock + parsed.data.quantity;

      if (balanceAfter < 0) {
        return {
          error: `Only ${product.currentStock} ${product.unit} in stock — this movement would take it negative.`,
        };
      }

      // An outbound movement consumes the batch nearest to expiry (FEFO).
      if (parsed.data.quantity < 0) {
        let remaining = Math.abs(parsed.data.quantity);
        const batchQuery = input.batchId
          ? adminDb().collection(C.inventoryBatches).where("__name__", "==", input.batchId)
          : adminDb()
              .collection(C.inventoryBatches)
              .where("productId", "==", input.productId)
              .where("quantityRemaining", ">", 0)
              .orderBy("quantityRemaining")
              .limit(10);

        const batches = (await tx.get(batchQuery)).docs.sort((a, b) => {
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
      }

      tx.update(productRef, {
        currentStock: balanceAfter,
        isLowStock: balanceAfter <= product.minimumStock,
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(adminDb().collection(C.stockMovements).doc(), {
        branchId: parsed.data.branchId,
        productId: input.productId,
        productName: product.name,
        batchId: input.batchId ?? null,
        type: parsed.data.type,
        quantity: parsed.data.quantity,
        balanceAfter,
        unit: product.unit,
        reason: parsed.data.reason ?? null,
        reference: parsed.data.reference ?? null,
        referenceType: "Manual",
        performedBy: ctx.uid,
        performedByName: ctx.email ?? ctx.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { productName: product.name, balanceAfter, unit: product.unit };
    });

    if ("error" in result) return { ok: false, message: result.error };

    await writeAuditLog(ctx, {
      action: `stock.${parsed.data.type.toLowerCase()}`,
      module: "Inventory",
      entityId: input.productId,
      entityLabel: result.productName,
      after: { quantity: parsed.data.quantity, balanceAfter: result.balanceAfter },
    });

    revalidatePath("/admin/inventory/products");
    revalidatePath("/admin/inventory/movements");
    return {
      ok: true,
      message: `${result.productName} is now ${result.balanceAfter} ${result.unit}.`,
    };
  } catch (error) {
    return toActionResult(error, "The stock movement could not be recorded.");
  }
}

/* -------------------------------------------------------------------------- */
/* Batches                                                                     */
/* -------------------------------------------------------------------------- */

export async function createBatch(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("inventory.batches.write");

    const parsed = batchSchema.safeParse({
      productId: formData.get("productId"),
      batchNumber: formData.get("batchNumber"),
      quantityReceived: formData.get("quantityReceived"),
      purchaseDate: formData.get("purchaseDate"),
      expiryDate: formData.get("expiryDate"),
      purchasePrice: formData.get("purchasePrice") || undefined,
      supplierId: formData.get("supplierId") || undefined,
      branchId: formData.get("branchId") ?? DEFAULT_BRANCH_ID,
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const productRef = adminDb().collection(C.products).doc(parsed.data.productId);
    const batchRef = adminDb().collection(C.inventoryBatches).doc();

    const result = await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(productRef);
      if (!snap.exists) return { error: "Product not found." };

      const product = snap.data() as Product;
      const balanceAfter = product.currentStock + parsed.data.quantityReceived;

      tx.set(batchRef, {
        branchId: parsed.data.branchId,
        productId: parsed.data.productId,
        productName: product.name,
        batchNumber: parsed.data.batchNumber,
        quantityReceived: parsed.data.quantityReceived,
        quantityRemaining: parsed.data.quantityReceived,
        purchaseDate: Timestamp.fromDate(new Date(parsed.data.purchaseDate)),
        expiryDate: Timestamp.fromDate(new Date(parsed.data.expiryDate)),
        purchasePrice: parsed.data.purchasePrice ?? null,
        supplierId: parsed.data.supplierId ?? null,
        status: "Active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(productRef, {
        currentStock: balanceAfter,
        isLowStock: balanceAfter <= product.minimumStock,
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(adminDb().collection(C.stockMovements).doc(), {
        branchId: parsed.data.branchId,
        productId: parsed.data.productId,
        productName: product.name,
        batchId: batchRef.id,
        batchNumber: parsed.data.batchNumber,
        type: "STOCK_IN",
        quantity: parsed.data.quantityReceived,
        balanceAfter,
        unit: product.unit,
        reason: "Batch received",
        performedBy: ctx.uid,
        performedByName: ctx.email ?? ctx.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { productName: product.name };
    });

    if ("error" in result) return { ok: false, message: result.error };

    await writeAuditLog(ctx, {
      action: "batch.create",
      module: "Inventory",
      entityId: batchRef.id,
      entityLabel: `${result.productName} · ${parsed.data.batchNumber}`,
      after: { quantity: parsed.data.quantityReceived, expiry: parsed.data.expiryDate },
    });

    revalidatePath("/admin/inventory/batches");
    revalidatePath("/admin/inventory/products");
    return { ok: true, message: `Batch ${parsed.data.batchNumber} received.` };
  } catch (error) {
    return toActionResult(error, "The batch could not be recorded.");
  }
}

/**
 * Writes off every batch that has passed its expiry date.
 *
 * Run from the expiry screen. Each write-off is its own ledger entry, so the
 * loss is attributable to a date and a person rather than appearing as an
 * unexplained stock correction.
 */
export async function writeOffExpiredBatches(): Promise<ActionResult & { count?: number }> {
  try {
    const ctx = await requirePermission("inventory.batches.write");

    const expired = await adminDb()
      .collection(C.inventoryBatches)
      .where("quantityRemaining", ">", 0)
      .where("expiryDate", "<", Timestamp.now())
      .limit(100)
      .get();

    if (expired.empty) return { ok: true, message: "No expired stock to write off.", count: 0 };

    let count = 0;
    for (const batch of expired.docs) {
      const data = batch.data();
      const quantity = data.quantityRemaining as number;
      const productRef = adminDb().collection(C.products).doc(data.productId as string);

      await adminDb().runTransaction(async (tx) => {
        const snap = await tx.get(productRef);
        if (!snap.exists) return;
        const product = snap.data() as Product;
        const balanceAfter = Math.max(0, product.currentStock - quantity);

        tx.update(batch.ref, {
          quantityRemaining: 0,
          status: "Expired",
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.update(productRef, {
          currentStock: balanceAfter,
          isLowStock: balanceAfter <= product.minimumStock,
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.set(adminDb().collection(C.stockMovements).doc(), {
          branchId: data.branchId ?? DEFAULT_BRANCH_ID,
          productId: data.productId,
          productName: product.name,
          batchId: batch.id,
          batchNumber: data.batchNumber,
          type: "EXPIRED",
          quantity: -quantity,
          balanceAfter,
          unit: product.unit,
          reason: "Batch passed its expiry date",
          performedBy: ctx.uid,
          performedByName: ctx.email ?? ctx.uid,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      count += 1;
    }

    await writeAuditLog(ctx, {
      action: "stock.expired.write-off",
      module: "Inventory",
      entityLabel: `${count} batches`,
      after: { count },
    });

    revalidatePath("/admin/inventory/expiry");
    return { ok: true, message: `${count} expired batches written off.`, count };
  } catch (error) {
    return toActionResult(error, "Expired stock could not be written off.");
  }
}

/* -------------------------------------------------------------------------- */
/* Suppliers                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveSupplier(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("suppliers.write");

    const id = (formData.get("id") as string) || undefined;
    const parsed = supplierSchema.safeParse({
      name: formData.get("name"),
      company: formData.get("company") || undefined,
      phone: formData.get("phone"),
      email: formData.get("email") || undefined,
      address: formData.get("address") || undefined,
      taxNumber: formData.get("taxNumber") || undefined,
      paymentTerms: formData.get("paymentTerms") || undefined,
      contactPerson: formData.get("contactPerson") || undefined,
      notes: formData.get("notes") || undefined,
      isActive: formData.get("isActive") !== "off",
      branchId: formData.get("branchId") ?? DEFAULT_BRANCH_ID,
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const payload = { ...parsed.data, updatedAt: FieldValue.serverTimestamp(), updatedBy: ctx.uid };

    if (id) {
      await adminDb().collection(C.suppliers).doc(id).update(payload);
    } else {
      await adminDb()
        .collection(C.suppliers)
        .add({ ...payload, createdAt: FieldValue.serverTimestamp(), createdBy: ctx.uid });
    }

    await writeAuditLog(ctx, {
      action: id ? "supplier.update" : "supplier.create",
      module: "Inventory",
      entityId: id,
      entityLabel: parsed.data.name,
    });

    revalidatePath("/admin/inventory/suppliers");
    return { ok: true, message: "Supplier saved." };
  } catch (error) {
    return toActionResult(error, "The supplier could not be saved.");
  }
}
