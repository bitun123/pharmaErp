import { APIError } from "better-auth/api";
import type { PlatformSignInResponse, SignInRequest } from "@pharma/contracts";
import { signInFailed } from "../../../shared/errors.ts";
import { hashPassword, verifyPassword } from "../../../shared/password.ts";
import type { PlatformAuth } from "./platform-auth.better-auth.ts";
import type { PlatformAuthRepository } from "../repositories/platform-auth.repository.ts";

const MS_PER_MINUTE = 60_000;
const HTTP_UNAUTHORIZED = 401;

export interface PlatformSignInInput extends SignInRequest {
  // Request metadata forwarded to Better Auth for the session record.
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export interface PlatformSignInResult {
  body: PlatformSignInResponse;
  // Set-Cookie header values; the session token travels only in the cookie.
  setCookies: string[];
}

export interface PlatformAuthService {
  signIn(input: PlatformSignInInput): Promise<PlatformSignInResult>;
}

export interface PlatformAuthSettings {
  maxFailedAttempts: number;
  lockoutMinutes: number;
}

// Computed once: verifying against it costs the same as a real check, so locked and
// deactivated accounts cannot be told apart from wrong passwords by response time.
let dummyHash: Promise<string> | undefined;
const getDummyHash = (): Promise<string> => (dummyHash ??= hashPassword("timing-equaliser"));

// Platform sign-in rules (API.md 4.2, PRD NFR-SEC-03): every failure, whether an unknown
// email, wrong password, locked or deactivated account, returns the same error.
export function createPlatformAuthService(
  auth: PlatformAuth,
  repository: PlatformAuthRepository,
  settings: PlatformAuthSettings,
  now: () => Date = () => new Date(),
): PlatformAuthService {
  async function failWithoutChecking(password: string): Promise<never> {
    await verifyPassword(await getDummyHash(), password);
    throw signInFailed();
  }

  return {
    async signIn(input) {
      const user = await repository.findByEmail(input.email);

      // Unknown email: Better Auth runs its own constant-cost check and then fails, so the
      // timing matches a wrong password for a real account.
      if (user !== null) {
        if (user.lockedUntil !== null && user.lockedUntil <= now()) {
          await repository.clearExpiredLock(user.id, now());
          user.failedLoginCount = 0;
          user.lockedUntil = null;
        }
        if (user.status !== "active" || user.lockedUntil !== null) {
          return failWithoutChecking(input.password);
        }
      }

      const headers = new Headers();
      if (input.userAgent !== undefined) headers.set("user-agent", input.userAgent);
      if (input.ipAddress !== undefined) headers.set("x-forwarded-for", input.ipAddress);

      try {
        const { headers: responseHeaders } = await auth.api.signInEmail({
          body: { email: input.email, password: input.password },
          headers,
          returnHeaders: true,
        });

        if (user === null) throw signInFailed();
        await repository.recordSuccessfulLogin(user.id, now());
        return {
          body: {
            user: { id: user.id, email: user.email, fullName: user.fullName, kind: user.kind },
          },
          setCookies: responseHeaders.getSetCookie(),
        };
      } catch (error) {
        if (!(error instanceof APIError) || error.statusCode !== HTTP_UNAUTHORIZED) throw error;
        if (user !== null) {
          const lockedUntil = new Date(now().getTime() + settings.lockoutMinutes * MS_PER_MINUTE);
          await repository.recordFailedLogin(user.id, settings.maxFailedAttempts, lockedUntil);
        }
        throw signInFailed();
      }
    },
  };
}
