import "server-only";

import { headers } from "next/headers";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import type { AuthContext } from "@/lib/auth/permissions";

/**
 * Audit trail.
 *
 * Every mutation that touches money, medicine, stock or identity writes one of
 * these. Logs are append-only: the Firestore rules permit `create` for signed-in
 * staff and deny `update`/`delete` to everyone, including a super admin.
 */

export interface AuditInput {
  action: string;
  module: string;
  entityId?: string;
  entityLabel?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  branchId?: string;
}

/** Fields that must never be copied into an audit diff. */
const REDACTED_KEYS = new Set([
  "password",
  "privateKey",
  "medicalHistory",
  "allergies",
  "contraindications",
  "notes",
  "beforeImagePaths",
  "afterImagePaths",
  "consentDocumentPath",
]);

function redact(value: Record<string, unknown> | null | undefined) {
  if (!value) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = REDACTED_KEYS.has(k) ? "[redacted]" : v;
  }
  return out;
}

/**
 * Returns only the keys that actually changed, so the log stays readable and
 * stores the minimum amount of patient-adjacent data.
 */
export function diff(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
) {
  if (!before) return { before: null, after: redact(after) };
  if (!after) return { before: redact(before), after: null };

  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changedBefore[key] = before[key];
      changedAfter[key] = after[key];
    }
  }
  return { before: redact(changedBefore), after: redact(changedAfter) };
}

export async function writeAuditLog(ctx: AuthContext, input: AuditInput): Promise<void> {
  if (!isAdminConfigured) return;

  try {
    const h = await headers();
    await adminDb()
      .collection(C.auditLogs)
      .add({
        at: new Date(),
        userId: ctx.uid,
        userName: ctx.email ?? ctx.uid,
        userRole: ctx.role,
        action: input.action,
        module: input.module,
        entityId: input.entityId ?? null,
        entityLabel: input.entityLabel ?? null,
        before: input.before ?? null,
        after: input.after ?? null,
        branchId: input.branchId ?? null,
        ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: h.get("user-agent") ?? null,
      });
  } catch (error) {
    // Never let audit logging break the operation it is recording, but make the
    // failure loud in the server logs so it can be investigated.
    console.error("[audit] failed to write log entry", input.action, error);
  }
}
