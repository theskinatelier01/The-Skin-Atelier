import { NextResponse, type NextRequest } from "next/server";

import { adminAuth, adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/auth/constants";
import { permissionsForRole, type Role } from "@/lib/auth/permissions";

/**
 * Session exchange.
 *
 * The browser signs in with the Firebase client SDK and posts the resulting ID
 * token here. We verify it server-side, confirm the account is a provisioned
 * staff user, and mint an httpOnly session cookie. The ID token itself is never
 * stored in the browser, so an XSS bug cannot lift a long-lived credential.
 */

export async function POST(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured on the server." },
      { status: 503 },
    );
  }

  let idToken: string;
  try {
    const body = (await request.json()) as { idToken?: string };
    if (!body.idToken) throw new Error("missing token");
    idToken = body.idToken;
  } catch {
    return NextResponse.json({ error: "An ID token is required." }, { status: 400 });
  }

  try {
    // checkRevoked: a disabled account cannot trade a stale token for a session.
    const decoded = await adminAuth().verifyIdToken(idToken, true);

    const userSnap = await adminDb().collection(C.users).doc(decoded.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json(
        { error: "This account is not provisioned for the clinic system." },
        { status: 403 },
      );
    }

    const user = userSnap.data() as { role: Role; isActive?: boolean };
    if (user.isActive === false) {
      return NextResponse.json({ error: "This account has been deactivated." }, { status: 403 });
    }

    // Keep the custom claim in step with the stored role. Firestore and Storage
    // rules read the claim, so a role changed in the admin must land here too.
    const existing = decoded.role as string | undefined;
    if (existing !== user.role) {
      await adminAuth().setCustomUserClaims(decoded.uid, { role: user.role });
    }

    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    await adminDb().collection(C.users).doc(decoded.uid).update({ lastLoginAt: new Date() });

    const response = NextResponse.json({
      ok: true,
      role: user.role,
      permissions: permissionsForRole(user.role),
      // Tells the client whether to force a token refresh before navigating.
      claimUpdated: existing !== user.role,
    });

    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });

    return response;
  } catch (error) {
    console.error("[auth] session exchange failed", error);
    return NextResponse.json({ error: "Sign-in could not be completed." }, { status: 401 });
  }
}

/** Sign out: revoke refresh tokens so the session cannot be resurrected. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
