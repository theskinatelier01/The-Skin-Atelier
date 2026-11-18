import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import {
  DEFAULT_DOCTORS,
  DEFAULT_FAQS,
  DEFAULT_GALLERY,
  DEFAULT_PACKAGES,
  DEFAULT_SERVICES,
  DEFAULT_SERVICE_CATEGORIES,
  DEFAULT_TESTIMONIALS,
} from "./defaults";

/**
 * Until a website collection holds at least one document, the public site
 * renders the bundled defaults for it. Saving a single record from the admin
 * would then replace the whole list on the site with that one record.
 *
 * So the first write to an empty collection copies the defaults in first, and
 * the edit is applied on top. Collections that already hold data are never
 * touched.
 */
export const DEFAULTS_BY_COLLECTION: Record<string, readonly { id: string }[]> = {
  [C.services]: DEFAULT_SERVICES,
  [C.serviceCategories]: DEFAULT_SERVICE_CATEGORIES,
  [C.doctors]: DEFAULT_DOCTORS,
  [C.packages]: DEFAULT_PACKAGES,
  [C.testimonials]: DEFAULT_TESTIMONIALS,
  [C.faqs]: DEFAULT_FAQS,
  [C.gallery]: DEFAULT_GALLERY,
};

export async function seedCollectionIfEmpty(collection: string): Promise<boolean> {
  const items = DEFAULTS_BY_COLLECTION[collection];
  if (!items?.length) return false;

  const db = adminDb();
  const existing = await db.collection(collection).limit(1).get();
  if (!existing.empty) return false;

  const now = FieldValue.serverTimestamp();
  for (let i = 0; i < items.length; i += 400) {
    const batch = db.batch();
    for (const { id, ...data } of items.slice(i, i + 400)) {
      batch.set(db.collection(collection).doc(id), {
        ...stripUndefined(data),
        createdAt: now,
        updatedAt: now,
      });
    }
    await batch.commit();
  }
  return true;
}

export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripUndefined) as T;
  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)]),
    ) as T;
  }
  return value;
}
