import { randomUUID } from "node:crypto";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import type { Env } from "../../../config/env.ts";
import { hashPassword, verifyPassword } from "../../../shared/password.ts";

export const PLATFORM_AUTH_BASE_PATH = "/platform/auth";

const SECONDS_PER_MINUTE = 60;
const MS_PER_HOUR = 3_600_000;
// How often activity extends the idle expiry (ARCHITECTURE 7.2: idle timeout by refresh).
const SESSION_REFRESH_INTERVAL_SECONDS = 60;

type PlatformAuthEnv = Pick<
  Env,
  | "NODE_ENV"
  | "BETTER_AUTH_SECRET"
  | "CORS_ALLOWED_ORIGINS"
  | "SESSION_IDLE_TIMEOUT_MINUTES"
  | "SESSION_ABSOLUTE_TIMEOUT_HOURS"
>;

// Platform realm instance (ARCHITECTURE 7.1): its own tables, cookie name and cookie path,
// so a platform session can never resolve to a tenant user. Sign-up is disabled: platform
// users are created by the bootstrap command and by Super Admin only. Rate limiting is done
// by our own middleware because the service calls the Better Auth API directly.
export function createPlatformAuth(prisma: PrismaClient, env: PlatformAuthEnv) {
  return betterAuth({
    appName: "Pharma ERP Platform",
    basePath: PLATFORM_AUTH_BASE_PATH,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: env.CORS_ALLOWED_ORIGINS,
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      requireEmailVerification: false,
      password: {
        hash: hashPassword,
        verify: ({ hash, password }) => verifyPassword(hash, password),
      },
    },
    user: { modelName: "platformUser", fields: { name: "fullName" } },
    session: {
      modelName: "platformSession",
      expiresIn: env.SESSION_IDLE_TIMEOUT_MINUTES * SECONDS_PER_MINUTE,
      updateAge: SESSION_REFRESH_INTERVAL_SECONDS,
      additionalFields: {
        absoluteExpiresAt: { type: "date", required: true, input: false },
      },
    },
    account: { modelName: "platformAccount" },
    verification: { modelName: "platformVerification" },
    advanced: {
      cookiePrefix: "pharma_platform",
      useSecureCookies: env.NODE_ENV === "production",
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "strict",
        path: "/platform",
      },
      database: {
        generateId: () => randomUUID(),
        // DATABASE.md 4.8 deliberately omits the OAuth token columns and user.image (email
        // and password only), and platform users are created by our own service, so Better
        // Auth's generic schema check would report them as mismatches.
        validateSchema: false,
      },
    },
    databaseHooks: {
      session: {
        create: {
          // The absolute lifetime is fixed at creation and never extended (API.md 4.1).
          before: (session) =>
            Promise.resolve({
              data: {
                ...session,
                absoluteExpiresAt: new Date(
                  Date.now() + env.SESSION_ABSOLUTE_TIMEOUT_HOURS * MS_PER_HOUR,
                ),
              },
            }),
        },
      },
    },
  });
}

export type PlatformAuth = ReturnType<typeof createPlatformAuth>;
