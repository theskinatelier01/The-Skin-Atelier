"use server";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import { fromSnapshot } from "@/lib/firebase/convert";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getServices } from "@/lib/cms/queries";
import type { Invoice, Lead, Patient, Product, StaffMember, Supplier } from "@/types";

export interface SearchHit {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
}

/**
 * Global search.
 *
 * Firestore has no full-text index, so each collection is queried with a
 * prefix range on its most useful field (`>= q` / `<= q + `). That is
 * exact-prefix, case-sensitive matching — adequate for looking up a patient by
 * name or an invoice by number, which is what the front desk actually does.
 * A fuzzy, typo-tolerant search would need a dedicated index such as Algolia
 * or Typesense; the shape of this function is designed to be swapped for one.
 *
 * Every collection is gated on the caller's permissions, so results are a
 * strict subset of what this user could open directly.
 */
export async function searchEverything(rawQuery: string): Promise<SearchHit[]> {
  const ctx = await getAuthContext();
  if (!ctx || !isAdminConfigured) return [];

  const q = rawQuery.trim();
  if (q.length < 2) return [];

  const end = `${q}`;
  const db = adminDb();
  const hits: SearchHit[] = [];
  const tasks: Promise<void>[] = [];

  /* -- Services come from the cached CMS read, so they cost nothing extra. -- */
  if (hasPermission(ctx, "cms.services.read")) {
    tasks.push(
      getServices().then((services) => {
        const lower = q.toLowerCase();
        for (const s of services.filter((s) => s.name.toLowerCase().includes(lower)).slice(0, 5)) {
          hits.push({
            id: s.id,
            group: "Treatments",
            title: s.name,
            subtitle: s.categoryName,
            href: `/admin/website/services/${s.id}`,
          });
        }
      }),
    );
  }

  if (hasPermission(ctx, "patients.read")) {
    tasks.push(
      db
        .collection(C.patients)
        .orderBy("fullName")
        .startAt(q)
        .endAt(end)
        .limit(6)
        .get()
        .then((snap) => {
          for (const doc of snap.docs) {
            const p = fromSnapshot<Patient>(doc);
            hits.push({
              id: p.id,
              group: "Patients",
              title: p.fullName,
              subtitle: `${p.patientCode} · ${p.phone}`,
              href: `/admin/clinic/patients/${p.id}`,
            });
          }
        })
        .catch(() => undefined),
    );

    // Phone lookup is how reception actually finds a returning patient.
    tasks.push(
      db
        .collection(C.patients)
        .orderBy("phone")
        .startAt(q)
        .endAt(end)
        .limit(4)
        .get()
        .then((snap) => {
          for (const doc of snap.docs) {
            const p = fromSnapshot<Patient>(doc);
            if (hits.some((h) => h.id === p.id && h.group === "Patients")) continue;
            hits.push({
              id: p.id,
              group: "Patients",
              title: p.fullName,
              subtitle: `${p.patientCode} · ${p.phone}`,
              href: `/admin/clinic/patients/${p.id}`,
            });
          }
        })
        .catch(() => undefined),
    );
  }

  if (hasPermission(ctx, "invoices.read")) {
    tasks.push(
      db
        .collection(C.invoices)
        .orderBy("invoiceNumber")
        .startAt(q.toUpperCase())
        .endAt(`${q.toUpperCase()}`)
        .limit(5)
        .get()
        .then((snap) => {
          for (const doc of snap.docs) {
            const inv = fromSnapshot<Invoice>(doc);
            hits.push({
              id: inv.id,
              group: "Invoices",
              title: inv.invoiceNumber,
              subtitle: inv.patientName,
              meta: inv.status,
              href: `/admin/clinic/invoices/${inv.id}`,
            });
          }
        })
        .catch(() => undefined),
    );
  }

  if (hasPermission(ctx, "inventory.read")) {
    tasks.push(
      db
        .collection(C.products)
        .orderBy("name")
        .startAt(q)
        .endAt(end)
        .limit(5)
        .get()
        .then((snap) => {
          for (const doc of snap.docs) {
            const p = fromSnapshot<Product>(doc);
            hits.push({
              id: p.id,
              group: "Products",
              title: p.name,
              subtitle: `${p.sku} · ${p.category}`,
              meta: `${p.currentStock} ${p.unit}`,
              href: `/admin/inventory/products/${p.id}`,
            });
          }
        })
        .catch(() => undefined),
    );
  }

  if (hasPermission(ctx, "suppliers.read")) {
    tasks.push(
      db
        .collection(C.suppliers)
        .orderBy("name")
        .startAt(q)
        .endAt(end)
        .limit(4)
        .get()
        .then((snap) => {
          for (const doc of snap.docs) {
            const s = fromSnapshot<Supplier>(doc);
            hits.push({
              id: s.id,
              group: "Suppliers",
              title: s.name,
              subtitle: s.company ?? s.phone,
              href: `/admin/inventory/suppliers/${s.id}`,
            });
          }
        })
        .catch(() => undefined),
    );
  }

  if (hasPermission(ctx, "leads.read")) {
    tasks.push(
      db
        .collection(C.leads)
        .orderBy("fullName")
        .startAt(q)
        .endAt(end)
        .limit(4)
        .get()
        .then((snap) => {
          for (const doc of snap.docs) {
            const l = fromSnapshot<Lead>(doc);
            hits.push({
              id: l.id,
              group: "Leads",
              title: l.fullName,
              subtitle: `${l.phone} · ${l.source}`,
              meta: l.stage,
              href: `/admin/clinic/leads/${l.id}`,
            });
          }
        })
        .catch(() => undefined),
    );
  }

  if (hasPermission(ctx, "staff.read")) {
    tasks.push(
      db
        .collection(C.staff)
        .orderBy("fullName")
        .startAt(q)
        .endAt(end)
        .limit(4)
        .get()
        .then((snap) => {
          for (const doc of snap.docs) {
            const s = fromSnapshot<StaffMember>(doc);
            hits.push({
              id: s.id,
              group: "Staff",
              title: s.fullName,
              subtitle: s.department,
              href: `/admin/staff/${s.id}`,
            });
          }
        })
        .catch(() => undefined),
    );
  }

  await Promise.all(tasks);

  // Patients first — the overwhelmingly common reason to open this dialog.
  const order = ["Patients", "Invoices", "Treatments", "Products", "Leads", "Suppliers", "Staff"];
  return hits
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
    .slice(0, 24);
}
