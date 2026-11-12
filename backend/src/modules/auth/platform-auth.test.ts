import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { errorResponseSchema, platformSignInResponseSchema } from "@pharma/contracts";
import { createApp } from "../../app.ts";
import { loadEnv } from "../../config/env.ts";
import { createLogger } from "../../shared/logger.ts";
import { hashPassword } from "../../shared/password.ts";
import { createPlatformAuth } from "./services/platform-auth.better-auth.ts";
import { PlatformAuthRepository } from "./repositories/platform-auth.repository.ts";
import { createPlatformAuthService } from "./services/platform-auth.service.ts";

// Integration tests run against a real local PostgreSQL (AGENTS 12) with synthetic users
// that they create and remove themselves. They refuse to run against a non-local database.
loadDotenv({ path: resolve(import.meta.dirname, "../../../../.env"), quiet: true });
const databaseUrl = process.env["DATABASE_URL"];
const isLocalDatabase =
  databaseUrl !== undefined && ["localhost", "127.0.0.1"].includes(new URL(databaseUrl).hostname);

const SIGN_IN_PATH = "/platform/auth/sign-in/email";
const ADMIN_ORIGIN = "http://localhost:3001";
const PASSWORD = "Correct-Horse-Battery-9";
const GENERIC_MESSAGE = "The email or password is incorrect.";
const MS_PER_MINUTE = 60_000;

function buildEnv(overrides: Record<string, string> = {}) {
  return loadEnv({
    NODE_ENV: "test",
    PORT: "8080",
    LOG_LEVEL: "silent",
    PUBLIC_WEB_URL: "http://localhost:3000",
    PUBLIC_ADMIN_URL: ADMIN_ORIGIN,
    DATABASE_URL: databaseUrl ?? "postgresql://unused@localhost:5432/unused",
    CORS_ALLOWED_ORIGINS: `http://localhost:3000,${ADMIN_ORIGIN}`,
    BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
    SESSION_IDLE_TIMEOUT_MINUTES: "30",
    SESSION_ABSOLUTE_TIMEOUT_HOURS: "12",
    // High so only the dedicated throttle test hits it.
    RATE_LIMIT_SIGN_IN_PER_MINUTE: "1000",
    ...overrides,
  });
}

describe.skipIf(!isLocalDatabase)("POST /platform/auth/sign-in/email", () => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl ?? "" });
  const createdUserIds: string[] = [];
  let clock = new Date();

  function buildApp(overrides: Record<string, string> = {}) {
    const env = buildEnv(overrides);
    const service = createPlatformAuthService(
      createPlatformAuth(prisma, env),
      new PlatformAuthRepository(prisma),
      {
        maxFailedAttempts: env.LOGIN_MAX_FAILED_ATTEMPTS,
        lockoutMinutes: env.LOGIN_LOCKOUT_MINUTES,
      },
      () => clock,
    );
    return createApp(env, createLogger(env), async () => undefined, service);
  }

  async function createUser(status: "active" | "deactivated" = "active") {
    const id = randomUUID();
    const email = `signin-test-${id}@example.test`;
    await prisma.platformUser.create({
      data: { id, email, fullName: "Test Admin", kind: "platform_admin", status },
    });
    await prisma.platformAccount.create({
      data: {
        id: randomUUID(),
        userId: id,
        providerId: "credential",
        accountId: id,
        password: await hashPassword(PASSWORD),
      },
    });
    createdUserIds.push(id);
    return { id, email };
  }

  const userRow = (id: string) => prisma.platformUser.findUniqueOrThrow({ where: { id } });
  const signIn = (app: ReturnType<typeof buildApp>, email: string, password: string) =>
    request(app).post(SIGN_IN_PATH).set("Origin", ADMIN_ORIGIN).send({ email, password });

  let app: ReturnType<typeof buildApp>;
  beforeAll(() => {
    app = buildApp();
  });
  beforeEach(() => {
    clock = new Date();
  });
  afterAll(async () => {
    await prisma.platformSession.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.platformAccount.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.platformUser.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  });

  it("signs in, sets a restricted cookie and returns no token (API.md 4.1)", async () => {
    const { id, email } = await createUser();
    const res = await signIn(app, email, PASSWORD);

    expect(res.status).toBe(200);
    const body = platformSignInResponseSchema.parse(res.body);
    expect(body.user).toMatchObject({ id, email, kind: "platform_admin" });
    expect(JSON.stringify(res.body)).not.toMatch(/token|password/i);
    expect(res.headers["cache-control"]).toBe("no-store");

    const cookies = res.headers["set-cookie"] ?? [];
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatch(/^pharma_platform\./);
    expect(cookies[0]).toMatch(/HttpOnly/i);
    expect(cookies[0]).toMatch(/SameSite=Strict/i);
    expect(cookies[0]).toMatch(/Path=\/platform/i);

    const sessions = await prisma.platformSession.findMany({ where: { userId: id } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.absoluteExpiresAt.getTime()).toBeGreaterThan(Date.now());
    expect((await userRow(id)).lastLoginAt).not.toBeNull();
  });

  it("stores the credential as an argon2id hash", async () => {
    const { id } = await createUser();
    const account = await prisma.platformAccount.findFirstOrThrow({ where: { userId: id } });
    expect(account.password).toMatch(/^\$argon2id\$/);
  });

  it("accepts the email in any letter case with surrounding spaces", async () => {
    const { email } = await createUser();
    const res = await signIn(app, `  ${email.toUpperCase()} `, PASSWORD);
    expect(res.status).toBe(200);
  });

  it("returns the same generic error for wrong password and unknown email", async () => {
    const { email } = await createUser();
    const wrong = await signIn(app, email, "wrong-password");
    const unknown = await signIn(app, `nobody-${randomUUID()}@example.test`, PASSWORD);

    for (const res of [wrong, unknown]) {
      expect(res.status).toBe(401);
      expect(res.headers["set-cookie"]).toBeUndefined();
      const parsed = errorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe("unauthenticated");
      expect(parsed.error.message).toBe(GENERIC_MESSAGE);
    }
  });

  it("locks the account after 5 failures and rejects the correct password (NFR-SEC-03)", async () => {
    const { id, email } = await createUser();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await signIn(app, email, "wrong-password")).status).toBe(401);
    }
    const locked = await userRow(id);
    expect(locked.failedLoginCount).toBe(5);
    expect(locked.lockedUntil).not.toBeNull();

    const res = await signIn(app, email, PASSWORD);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(GENERIC_MESSAGE);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(await prisma.platformSession.count({ where: { userId: id } })).toBe(0);
  });

  it("allows sign-in again after the 15-minute lock and resets the counter", async () => {
    const { id, email } = await createUser();
    for (let attempt = 0; attempt < 5; attempt += 1) await signIn(app, email, "wrong-password");

    clock = new Date(clock.getTime() + 14 * MS_PER_MINUTE);
    expect((await signIn(app, email, PASSWORD)).status).toBe(401);

    clock = new Date(clock.getTime() + 2 * MS_PER_MINUTE);
    expect((await signIn(app, email, PASSWORD)).status).toBe(200);
    const row = await userRow(id);
    expect(row.failedLoginCount).toBe(0);
    expect(row.lockedUntil).toBeNull();
  });

  it("does not re-lock on the first wrong password after a lock has expired", async () => {
    const { id, email } = await createUser();
    for (let attempt = 0; attempt < 5; attempt += 1) await signIn(app, email, "wrong-password");

    clock = new Date(clock.getTime() + 16 * MS_PER_MINUTE);
    await signIn(app, email, "wrong-password");
    const row = await userRow(id);
    expect(row.failedLoginCount).toBe(1);
    expect(row.lockedUntil).toBeNull();
  });

  it("resets the failure counter after a successful sign-in", async () => {
    const { id, email } = await createUser();
    await signIn(app, email, "wrong-password");
    await signIn(app, email, "wrong-password");
    expect((await signIn(app, email, PASSWORD)).status).toBe(200);
    expect((await userRow(id)).failedLoginCount).toBe(0);
  });

  it("counts concurrent wrong passwords without losing increments", async () => {
    const { id, email } = await createUser();
    await Promise.all(Array.from({ length: 5 }, () => signIn(app, email, "wrong-password")));
    const row = await userRow(id);
    expect(row.failedLoginCount).toBe(5);
    expect(row.lockedUntil).not.toBeNull();
  });

  it("rejects a deactivated user with the generic error and no session", async () => {
    const { id, email } = await createUser("deactivated");
    const res = await signIn(app, email, PASSWORD);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(GENERIC_MESSAGE);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(await prisma.platformSession.count({ where: { userId: id } })).toBe(0);
  });

  it("rejects a user that has no credential account", async () => {
    const id = randomUUID();
    const email = `signin-test-${id}@example.test`;
    await prisma.platformUser.create({
      data: { id, email, fullName: "No Credential", kind: "platform_admin" },
    });
    createdUserIds.push(id);
    expect((await signIn(app, email, PASSWORD)).status).toBe(401);
  });

  it("returns 422 with field errors for invalid input", async () => {
    const cases: [object, string][] = [
      [{ password: PASSWORD }, "email"],
      [{ email: "not-an-email", password: PASSWORD }, "email"],
      [{ email: "a@example.test" }, "password"],
      [{ email: "a@example.test", password: "" }, "password"],
      [{ email: "a@example.test", password: "x".repeat(129) }, "password"],
      [{ email: ["a@example.test"], password: PASSWORD }, "email"],
    ];
    for (const [payload, field] of cases) {
      const res = await request(app).post(SIGN_IN_PATH).set("Origin", ADMIN_ORIGIN).send(payload);
      expect(res.status).toBe(422);
      const parsed = errorResponseSchema.parse(res.body);
      expect(parsed.error.code).toBe("validation_failed");
      expect(parsed.error.fieldErrors?.some((e) => e.field === field)).toBe(true);
    }
  });

  it("rejects unknown fields", async () => {
    const res = await request(app)
      .post(SIGN_IN_PATH)
      .set("Origin", ADMIN_ORIGIN)
      .send({ email: "a@example.test", password: PASSWORD, rememberMe: true });
    expect(res.status).toBe(422);
  });

  it("returns 400 for malformed JSON and for a missing JSON body", async () => {
    const malformed = await request(app)
      .post(SIGN_IN_PATH)
      .set("Origin", ADMIN_ORIGIN)
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe("malformed_request");

    const noBody = await request(app)
      .post(SIGN_IN_PATH)
      .set("Origin", ADMIN_ORIGIN)
      .set("Content-Type", "text/plain")
      .send("email=a");
    expect(noBody.status).toBe(400);
    expect(noBody.body.error.code).toBe("malformed_request");
  });

  it("returns 413 for an oversize body", async () => {
    const res = await request(app)
      .post(SIGN_IN_PATH)
      .set("Origin", ADMIN_ORIGIN)
      .send({ email: "a@example.test", password: "x".repeat(2_000_000) });
    expect(res.status).toBe(413);
  });

  it("returns 403 csrf_invalid for an untrusted Origin and never reaches the service", async () => {
    const { email } = await createUser();
    const res = await request(app)
      .post(SIGN_IN_PATH)
      .set("Origin", "https://evil.example")
      .send({ email, password: PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("csrf_invalid");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("does not allow other methods on the path", async () => {
    const res = await request(app).get(SIGN_IN_PATH);
    expect(res.status).toBe(404);
  });

  it("throttles per IP and email with Retry-After (API.md 8)", async () => {
    const limited = buildApp({ RATE_LIMIT_SIGN_IN_PER_MINUTE: "2" });
    const email = `throttle-${randomUUID()}@example.test`;
    expect((await signIn(limited, email, "x")).status).toBe(401);
    expect((await signIn(limited, email, "x")).status).toBe(401);
    const res = await signIn(limited, email, "x");
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("rate_limited");
    expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);

    const otherEmail = await signIn(limited, `other-${randomUUID()}@example.test`, "x");
    expect(otherEmail.status).toBe(401);
  });
});
