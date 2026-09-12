import "server-only";

import { cache } from "react";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import { hasPermission, type AuthContext } from "@/lib/auth/permissions";

/**
 * Sidebar counters.
 *
 * Uses `count()` aggregation queries rather than fetching documents, so the
 * badges cost a few index reads instead of a full page of data on every
 * navigation. Each counter is gated on the same permission as the link it sits
 * on, and any individual failure degrades to no badge rather than a broken
 * layout.
 */

export type BadgeKey = "requests" | "queue" | "lowStock" | "unpaid" | "consent";

async function safeCount(build: () => FirebaseFirestore.Query): Promise<number> {
  try {
    const snapshot = await build().count().get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

export const getSidebarBadges = cache(
  async (ctx: AuthContext): Promise<Partial<Record<BadgeKey, number>>> => {
    if (!isAdminConfigured) return {};

    const db = adminDb();
    const out: Partial<Record<BadgeKey, number>> = {};

    const tasks: Promise<void>[] = [];

    if (hasPermission(ctx, "appointments.write")) {
      tasks.push(
        safeCount(() =>
          db.collection(C.appointmentRequests).where("status", "==", "New"),
        ).then((n) => void (out.requests = n)),
      );
    }

    if (hasPermission(ctx, "queue.manage")) {
      tasks.push(
        safeCount(() =>
          db.collection(C.queue).where("status", "in", ["WAITING", "CALLED"]),
        ).then((n) => void (out.queue = n)),
      );
    }

    if (hasPermission(ctx, "inventory.read")) {
      // Firestore cannot compare two fields, so "below minimum" is flagged on
      // write into `isLowStock` and simply read back here.
      tasks.push(
        safeCount(() =>
          db.collection(C.products).where("isLowStock", "==", true).where("isActive", "==", true),
        ).then((n) => void (out.lowStock = n)),
      );
    }

    if (hasPermission(ctx, "invoices.read")) {
      tasks.push(
        safeCount(() =>
          db.collection(C.invoices).where("status", "in", ["Unpaid", "Partially Paid"]),
        ).then((n) => void (out.unpaid = n)),
      );
    }

    if (hasPermission(ctx, "cms.beforeAfter.approve")) {
      tasks.push(
        safeCount(() =>
          db.collection(C.beforeAfterCases).where("publicationStatus", "==", "Pending Review"),
        ).then((n) => void (out.consent = n)),
      );
    }

    await Promise.all(tasks);
    return out;
  },
);

export const getUnreadNotificationCount = cache(async (ctx: AuthContext): Promise<number> => {
  if (!isAdminConfigured) return 0;

  // Firestore cannot express "array does not contain", so the unread filter is
  // applied in memory over a bounded window of recent notifications.
  try {
    const snap = await adminDb()
      .collection(C.notifications)
      .where("targetRoles", "array-contains", ctx.role)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    return snap.docs.filter((doc) => {
      const readBy = (doc.data().readBy ?? []) as string[];
      return !readBy.includes(ctx.uid);
    }).length;
  } catch {
    return 0;
  }
});
