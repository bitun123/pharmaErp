import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.ts";

const valid = {
  NODE_ENV: "test",
  PORT: "8080",
  PUBLIC_WEB_URL: "http://localhost:3000",
  PUBLIC_ADMIN_URL: "http://localhost:3001",
  BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
  SESSION_IDLE_TIMEOUT_MINUTES: "30",
  SESSION_ABSOLUTE_TIMEOUT_HOURS: "12",
  DATABASE_URL: "postgresql://test-user:test-pass@localhost:5432/test_db",
  CORS_ALLOWED_ORIGINS: "http://localhost:3000, http://localhost:3001",
};

describe("loadEnv", () => {
  it("parses a valid environment", () => {
    const env = loadEnv(valid);
    expect(env.PORT).toBe(8080);
    expect(env.CORS_ALLOWED_ORIGINS).toEqual(["http://localhost:3000", "http://localhost:3001"]);
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("defaults the sign-in lockout to 5 attempts and 15 minutes", () => {
    const env = loadEnv(valid);
    expect(env.LOGIN_MAX_FAILED_ATTEMPTS).toBe(5);
    expect(env.LOGIN_LOCKOUT_MINUTES).toBe(15);
    expect(env.RATE_LIMIT_SIGN_IN_PER_MINUTE).toBe(5);
  });

  it("rejects a session secret shorter than 32 characters without echoing it", () => {
    const shortSecret = "short-secret-value";
    expect(() => loadEnv({ ...valid, BETTER_AUTH_SECRET: shortSecret })).toThrowError(
      /BETTER_AUTH_SECRET/,
    );
    try {
      loadEnv({ ...valid, BETTER_AUTH_SECRET: shortSecret });
    } catch (error) {
      expect(String(error)).not.toContain(shortSecret);
    }
  });

  it("reports variable names but never values on failure", () => {
    const secretLooking = "not-a-url-super-secret-value";
    expect(() => loadEnv({ ...valid, PUBLIC_WEB_URL: secretLooking })).toThrowError(
      /PUBLIC_WEB_URL/,
    );
    try {
      loadEnv({ ...valid, PUBLIC_WEB_URL: secretLooking });
    } catch (error) {
      expect(String(error)).not.toContain(secretLooking);
    }
  });

  it("rejects missing required variables", () => {
    expect(() => loadEnv({})).toThrowError(/NODE_ENV/);
  });

  it("rejects a DATABASE_URL that is not a PostgreSQL URL without echoing it", () => {
    const wrongScheme = "mysql://user:leaky-password@localhost/db";
    expect(() => loadEnv({ ...valid, DATABASE_URL: wrongScheme })).toThrowError(/DATABASE_URL/);
    try {
      loadEnv({ ...valid, DATABASE_URL: wrongScheme });
    } catch (error) {
      expect(String(error)).not.toContain("leaky-password");
    }
  });

  it("rejects wildcard CORS origins", () => {
    expect(() => loadEnv({ ...valid, CORS_ALLOWED_ORIGINS: "*" })).toThrowError(
      /CORS_ALLOWED_ORIGINS/,
    );
  });
});
