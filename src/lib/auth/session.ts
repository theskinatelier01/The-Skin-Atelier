import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { adminAuth, adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import {
  hasPermission,
  PermissionError,
  type AuthContext,
  type Permission,
  type Role,
} from "@/lib/auth/permissions";

export { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "./constants";

/**
 * Resolves the signed-in admin user for the current request.
 *
 * Wrapped in `cache()` so a single request verifies the session cookie once,
 * no matter how many server components ask for it.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  if (!isAdminConfigured) return null;

  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    // `true` checks the token against revoked sessions on every request, so
    // disabling a user takes effect immediately rather than at token expiry.
    const decoded = await adminAuth().verifySessionCookie(session, true);

    const snap = await adminDb().collection(C.users).doc(decoded.uid).get();
    if (!snap.exists) return null;

    const data = snap.data() as {
      role: Role;
      isActive?: boolean;
      email?: string;
      extraPermissions?: Permission[];
      deniedPermissions?: Permission[];
      branchIds?: string[];
    };

    if (data.isActive === false) return null;

    return {
      uid: decoded.uid,
      email: data.email ?? decoded.email ?? null,
      role: data.role,
      extraPermissions: data.extraPermissions,
      deniedPermissions: data.deniedPermissions,
      branchIds: data.branchIds ?? [],
    };
  } catch {
    // An invalid or expired cookie is a signed-out user, not an error.
    return null;
  }
});

/** Throws unless the caller holds `permission`. Use at the top of every action. */
export async function requirePermission(permission: Permission): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new PermissionError(permission);
  if (!hasPermission(ctx, permission)) throw new PermissionError(permission);
  return ctx;
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    const err = new Error("Authentication required");
    (err as Error & { code?: string }).code = "unauthenticated";
    throw err;
  }
  return ctx;
}

export async function can(permission: Permission): Promise<boolean> {
  return hasPermission(await getAuthContext(), permission);
}
