import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Route guard.
 *
 * The middleware only checks that a session cookie is *present* — it runs on
 * the edge runtime, where the Firebase Admin SDK cannot verify it. Real
 * verification happens in the admin layout and in every server action. This is
 * a redirect convenience, never the security boundary.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/admin") && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Return the user where they were heading once they sign in.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
