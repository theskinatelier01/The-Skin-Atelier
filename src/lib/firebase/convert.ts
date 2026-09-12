import "server-only";

import { Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";

/**
 * Firestore <-> application boundary.
 *
 * Firestore `Timestamp` objects cannot cross the React Server Component
 * boundary, so they are normalised to ISO strings exactly once, on read.
 */

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  );
}

export function normalise<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (isTimestampLike(value)) return value.toDate().toISOString() as unknown as T;
  if (value instanceof Date) return value.toISOString() as unknown as T;
  if (Array.isArray(value)) return value.map((v) => normalise(v)) as unknown as T;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // `undefined` is not serialisable across the RSC boundary.
      if (v === undefined) continue;
      out[k] = normalise(v);
    }
    return out as T;
  }
  return value;
}

export function fromSnapshot<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return normalise({ id: snap.id, ...snap.data() }) as T;
}

/** Strips `undefined` and injects server timestamps on the way in. */
export function toFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (typeof v === "string" && ISO_DATE.test(v)) {
      out[k] = Timestamp.fromDate(new Date(v));
      continue;
    }
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Timestamp)) {
      out[k] = toFirestore(v as Record<string, unknown>);
      continue;
    }
    out[k] = v;
  }
  return out;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
