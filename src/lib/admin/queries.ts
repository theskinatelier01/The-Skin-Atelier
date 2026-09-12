import "server-only";

import { cache } from "react";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import { fromSnapshot } from "@/lib/firebase/convert";
import { dateKey } from "@/lib/utils/format";
import type {
  Appointment,
  AppointmentRequest,
  AuditLog,
  Consultation,
  Expense,
  InventoryBatch,
  Invoice,
  Lead,
  Patient,
  Payment,
  Product,
  PurchaseOrder,
  QueueEntry,
  StaffMember,
  StockMovement,
  Supplier,
  TreatmentRecord,
} from "@/types";

/**
 * Admin reads.
 *
 * These are plain data-access helpers — authorisation happens in the page or
 * action that calls them, and again in the Firestore rules. Every list is
 * bounded by a limit, since an unbounded clinic collection grows forever.
 */

async function list<T>(
  build: (db: FirebaseFirestore.Firestore) => FirebaseFirestore.Query,
): Promise<T[]> {
  if (!isAdminConfigured) return [];
  try {
    const snap = await build(adminDb()).get();
    return snap.docs.map((d) => fromSnapshot<T>(d)).filter((d) => !(d as { deletedAt?: string }).deletedAt);
  } catch (error) {
    console.error("[admin] query failed", error);
    return [];
  }
}

async function one<T>(collection: string, id: string): Promise<T | null> {
  if (!isAdminConfigured) return null;
  try {
    const snap = await adminDb().collection(collection).doc(id).get();
    if (!snap.exists) return null;
    return fromSnapshot<T>(snap as FirebaseFirestore.QueryDocumentSnapshot);
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Appointments & scheduling                                                   */
/* -------------------------------------------------------------------------- */

export const getAppointmentsForDate = cache(async (date: string, branchId?: string) =>
  list<Appointment>((db) => {
    let q = db.collection(C.appointments).where("date", "==", date);
    if (branchId) q = q.where("branchId", "==", branchId);
    return q.orderBy("startTime").limit(200);
  }),
);

export const getAppointmentsInRange = cache(async (from: string, to: string, branchId?: string) =>
  list<Appointment>((db) => {
    let q = db.collection(C.appointments).where("date", ">=", from).where("date", "<=", to);
    if (branchId) q = q.where("branchId", "==", branchId);
    return q.orderBy("date").orderBy("startTime").limit(1000);
  }),
);

export const getUpcomingAppointmentsForPatient = cache(async (patientId: string) =>
  list<Appointment>((db) =>
    db
      .collection(C.appointments)
      .where("patientId", "==", patientId)
      .orderBy("date", "desc")
      .limit(50),
  ),
);

export const getAppointment = cache(async (id: string) => one<Appointment>(C.appointments, id));

export const getAppointmentRequests = cache(async (status?: string) =>
  list<AppointmentRequest>((db) => {
    let q = db.collection(C.appointmentRequests) as FirebaseFirestore.Query;
    if (status) q = q.where("status", "==", status);
    return q.orderBy("createdAt", "desc").limit(100);
  }),
);

export const getQueue = cache(async (branchId?: string) =>
  list<QueueEntry>((db) => {
    // An `in` filter rather than `!=`: Firestore requires an inequality field to
    // be the first orderBy, which would fight the branch filter and force a
    // composite index for what is a small, bounded collection.
    let q = db
      .collection(C.queue)
      .where("status", "in", ["WAITING", "CALLED", "WITH DOCTOR", "TREATMENT"]);
    if (branchId) q = q.where("branchId", "==", branchId);
    return q.limit(60);
  }),
);

/* -------------------------------------------------------------------------- */
/* Patients                                                                    */
/* -------------------------------------------------------------------------- */

export const getPatients = cache(async (limit = 50) =>
  list<Patient>((db) => db.collection(C.patients).orderBy("createdAt", "desc").limit(limit)),
);

export const getPatient = cache(async (id: string) => one<Patient>(C.patients, id));

export const getPatientNotes = cache(async (patientId: string) =>
  list((db) =>
    db.collection(C.patientNotes).where("patientId", "==", patientId).orderBy("createdAt", "desc").limit(50),
  ),
);

export const getConsultationsForPatient = cache(async (patientId: string) =>
  list<Consultation>((db) =>
    db.collection(C.consultations).where("patientId", "==", patientId).orderBy("date", "desc").limit(50),
  ),
);

export const getTreatmentsForPatient = cache(async (patientId: string) =>
  list<TreatmentRecord>((db) =>
    db.collection(C.treatments).where("patientId", "==", patientId).orderBy("date", "desc").limit(50),
  ),
);

export const getInvoicesForPatient = cache(async (patientId: string) =>
  list<Invoice>((db) =>
    db.collection(C.invoices).where("patientId", "==", patientId).orderBy("date", "desc").limit(50),
  ),
);

/* -------------------------------------------------------------------------- */
/* Clinical                                                                    */
/* -------------------------------------------------------------------------- */

export const getConsultations = cache(async (limit = 50) =>
  list<Consultation>((db) => db.collection(C.consultations).orderBy("date", "desc").limit(limit)),
);

export const getTreatments = cache(async (limit = 50) =>
  list<TreatmentRecord>((db) => db.collection(C.treatments).orderBy("date", "desc").limit(limit)),
);

export const getBeforeAfterCases = cache(async (status?: string) =>
  list((db) => {
    let q = db.collection(C.beforeAfterCases) as FirebaseFirestore.Query;
    if (status) q = q.where("publicationStatus", "==", status);
    return q.orderBy("createdAt", "desc").limit(100);
  }),
);

/* -------------------------------------------------------------------------- */
/* Finance                                                                     */
/* -------------------------------------------------------------------------- */

export const getInvoices = cache(async (limit = 50, status?: string) =>
  list<Invoice>((db) => {
    let q = db.collection(C.invoices) as FirebaseFirestore.Query;
    if (status) q = q.where("status", "==", status);
    return q.orderBy("date", "desc").limit(limit);
  }),
);

export const getInvoice = cache(async (id: string) => one<Invoice>(C.invoices, id));

export const getPayments = cache(async (limit = 100) =>
  list<Payment>((db) => db.collection(C.payments).orderBy("date", "desc").limit(limit)),
);

export const getPaymentsForInvoice = cache(async (invoiceId: string) =>
  list<Payment>((db) =>
    db.collection(C.payments).where("invoiceId", "==", invoiceId).orderBy("date", "desc").limit(50),
  ),
);

export const getExpenses = cache(async (limit = 100) =>
  list<Expense>((db) => db.collection(C.expenses).orderBy("date", "desc").limit(limit)),
);

/** Invoices dated within an inclusive ISO range, for reporting. */
export const getInvoicesBetween = cache(async (fromIso: string, toIso: string) =>
  list<Invoice>((db) =>
    db
      .collection(C.invoices)
      .where("date", ">=", new Date(fromIso))
      .where("date", "<=", new Date(toIso))
      .orderBy("date", "desc")
      .limit(2000),
  ),
);

export const getExpensesBetween = cache(async (fromIso: string, toIso: string) =>
  list<Expense>((db) =>
    db
      .collection(C.expenses)
      .where("date", ">=", new Date(fromIso))
      .where("date", "<=", new Date(toIso))
      .orderBy("date", "desc")
      .limit(2000),
  ),
);

/* -------------------------------------------------------------------------- */
/* Inventory                                                                   */
/* -------------------------------------------------------------------------- */

export const getProducts = cache(async (limit = 200) =>
  list<Product>((db) => db.collection(C.products).orderBy("name").limit(limit)),
);

export const getProduct = cache(async (id: string) => one<Product>(C.products, id));

export const getLowStockProducts = cache(async () =>
  list<Product>((db) =>
    db
      .collection(C.products)
      .where("isLowStock", "==", true)
      .where("isActive", "==", true)
      .limit(100),
  ),
);

export const getBatches = cache(async (productId?: string) =>
  list<InventoryBatch>((db) => {
    let q = db.collection(C.inventoryBatches) as FirebaseFirestore.Query;
    if (productId) q = q.where("productId", "==", productId);
    // FEFO: the batch closest to expiry is always consumed first.
    return q.orderBy("expiryDate").limit(300);
  }),
);

export const getExpiringBatches = cache(async (withinDays = 90) => {
  const cutoff = new Date(Date.now() + withinDays * 86_400_000);
  return list<InventoryBatch>((db) =>
    db
      .collection(C.inventoryBatches)
      .where("quantityRemaining", ">", 0)
      .where("expiryDate", "<=", cutoff)
      .orderBy("expiryDate")
      .limit(200),
  );
});

export const getStockMovements = cache(async (limit = 100, productId?: string) =>
  list<StockMovement>((db) => {
    let q = db.collection(C.stockMovements) as FirebaseFirestore.Query;
    if (productId) q = q.where("productId", "==", productId);
    return q.orderBy("createdAt", "desc").limit(limit);
  }),
);

export const getSuppliers = cache(async () =>
  list<Supplier>((db) => db.collection(C.suppliers).orderBy("name").limit(200)),
);

export const getPurchaseOrders = cache(async (limit = 50) =>
  list<PurchaseOrder>((db) => db.collection(C.purchaseOrders).orderBy("orderDate", "desc").limit(limit)),
);

/* -------------------------------------------------------------------------- */
/* CRM & people                                                                */
/* -------------------------------------------------------------------------- */

export const getLeads = cache(async (stage?: string) =>
  list<Lead>((db) => {
    let q = db.collection(C.leads) as FirebaseFirestore.Query;
    if (stage) q = q.where("stage", "==", stage);
    return q.orderBy("createdAt", "desc").limit(200);
  }),
);

export const getStaff = cache(async () =>
  list<StaffMember>((db) => db.collection(C.staff).orderBy("fullName").limit(200)),
);

export const getAuditLogs = cache(async (limit = 100, module?: string) =>
  list<AuditLog>((db) => {
    let q = db.collection(C.auditLogs) as FirebaseFirestore.Query;
    if (module) q = q.where("module", "==", module);
    return q.orderBy("at", "desc").limit(limit);
  }),
);

export const getNotifications = cache(async (role: string, limit = 60) =>
  list((db) =>
    db
      .collection(C.notifications)
      .where("targetRoles", "array-contains", role)
      .orderBy("createdAt", "desc")
      .limit(limit),
  ),
);

/* -------------------------------------------------------------------------- */
/* Aggregates                                                                  */
/* -------------------------------------------------------------------------- */

export interface TodaySummary {
  total: number;
  confirmed: number;
  waiting: number;
  checkedIn: number;
  completed: number;
  cancelled: number;
  noShows: number;
  revenue: number;
  outstanding: number;
}

/** The numbers the front desk needs at a glance, computed in one pass. */
export const getTodaySummary = cache(async (branchId?: string): Promise<TodaySummary> => {
  const today = dateKey();
  const [appointments, queue, invoices] = await Promise.all([
    getAppointmentsForDate(today, branchId),
    getQueue(branchId),
    list<Invoice>((db) =>
      db
        .collection(C.invoices)
        .where("date", ">=", new Date(`${today}T00:00:00.000Z`))
        .orderBy("date", "desc")
        .limit(300),
    ),
  ]);

  return {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === "Confirmed").length,
    waiting: queue.filter((q) => q.status === "WAITING").length,
    checkedIn: appointments.filter((a) =>
      ["Arrived", "In Consultation", "Treatment"].includes(a.status),
    ).length,
    completed: appointments.filter((a) => a.status === "Completed").length,
    cancelled: appointments.filter((a) => a.status === "Cancelled").length,
    noShows: appointments.filter((a) => a.status === "No Show").length,
    revenue: invoices
      .filter((i) => i.status !== "Void")
      .reduce((sum, i) => sum + (i.amountPaid ?? 0), 0),
    outstanding: invoices
      .filter((i) => i.status !== "Void")
      .reduce((sum, i) => sum + (i.balance ?? 0), 0),
  };
});
