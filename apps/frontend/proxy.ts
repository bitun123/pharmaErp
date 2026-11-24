import { NextResponse, type NextRequest } from "next/server";

// Pages that must stay reachable without a session.
const PUBLIC_PATHS = ["/signin", "/forgotpassword", "/set-password"];

// Better Auth session cookie (default prefix), with and without the HTTPS "__Secure-" prefix.
const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

// Set by a correct password while the emailed sign-in code is still pending (no session yet).
// It only opens the code page, nothing else.
const PENDING_CODE_COOKIES = ["better-auth.two_factor", "__Secure-better-auth.two_factor"];
const CODE_PAGE = "/otpverify";

// A cleared cookie can still arrive as an empty value, so presence alone is not enough.
const hasCookie = (request: NextRequest, names: string[]) =>
  names.some((name) => Boolean(request.cookies.get(name)?.value));

/**
 * First, cheap gate: no session cookie means no page. This only checks that the cookie
 * exists. It is NOT authorization: a stale cookie passes here, and the real session, role
 * and permission checks happen on the server (DAL) and in every API route.
 * It must not redirect signed-in users away from /signin: a stale cookie would loop.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const hasSessionCookie = hasCookie(request, SESSION_COOKIES);
  const hasPendingCodeCookie = hasCookie(request, PENDING_CODE_COOKIES);
  const isCodePage = pathname === CODE_PAGE || pathname.startsWith(`${CODE_PAGE}/`);

  if (!hasSessionCookie && !(isCodePage && hasPendingCodeCookie)) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip the API, Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
