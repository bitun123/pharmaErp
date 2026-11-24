import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthSession } from "@repo/contracts";
import { hasPermission } from "@/lib/permissions";

/**
 * Data Access Layer: the one place the server reads the session.
 * The backend is the source of truth. We forward the browser's cookies to it.
 * Cached per request, so layouts and pages can both call it without a second fetch.
 *
 * Returns null when there is no valid session. A backend outage THROWS (error.tsx
 * shows a Retry) so an outage is never mistaken for a logout.
 */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return null;

  const backendUrl = process.env.BACKEND_URL?.trim().replace(/\/+$/, "");
  if (!backendUrl) throw new Error("BACKEND_URL is not set.");

  const response = await fetch(`${backendUrl}/api/auth/get-session`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Session check failed (${response.status}).`);

  // Better Auth answers 200 with a null body when there is no session.
  return ((await response.json().catch(() => null)) as AuthSession | null) ?? null;
});

/** Signed in and email verified, otherwise redirects to sign-in. */
export async function requireUser(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) redirect("/signin");
  // The backend refuses to sign in unverified emails, so this is only a safety net.
  if (!session.user.emailVerified) redirect("/signin");
  return session;
}

/** requireUser() plus a permission check. Users without it go to /forbidden. */
export async function requirePermission(permission: string): Promise<AuthSession> {
  const session = await requireUser();
  if (!hasPermission(session.membership?.permissions ?? {}, permission)) redirect("/forbidden");
  return session;
}
