import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorResponseSchema } from "@pharma/contracts";
import { createApp } from "./app.ts";
import { loadEnv } from "./config/env.ts";
import { createLogger } from "./shared/logger.ts";

const env = loadEnv({
  NODE_ENV: "test",
  PORT: "8080",
  LOG_LEVEL: "silent",
  PUBLIC_WEB_URL: "http://localhost:3000",
  PUBLIC_ADMIN_URL: "http://localhost:3001",
  BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
  SESSION_IDLE_TIMEOUT_MINUTES: "30",
  SESSION_ABSOLUTE_TIMEOUT_HOURS: "12",
  DATABASE_URL: "postgresql://test-user:test-pass@localhost:5432/test_db",
  CORS_ALLOWED_ORIGINS: "http://localhost:3000",
});
let databaseAvailable = true;
const app = createApp(
  env,
  createLogger(env),
  async () => {
    if (!databaseAvailable) throw new Error("database down");
  },
  { signIn: () => Promise.reject(new Error("not used by health tests")) },
);

describe("health endpoints", () => {
  it("GET /health/live returns ok", async () => {
    const res = await request(app).get("/health/live");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /health/ready returns ok when the database is reachable", async () => {
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /health/ready returns 503 without details when the database is down", async () => {
    databaseAvailable = false;
    try {
      const res = await request(app).get("/health/ready");
      expect(res.status).toBe(503);
      expect(res.body).toEqual({ status: "unavailable" });
    } finally {
      databaseAvailable = true;
    }
  });
});

describe("cross-cutting behavior", () => {
  it("returns a server-generated request id header", async () => {
    const res = await request(app).get("/health/live").set("X-Request-Id", "client-supplied");
    expect(res.headers["x-request-id"]).toBeTruthy();
    expect(res.headers["x-request-id"]).not.toBe("client-supplied");
  });

  it("does not advertise the framework", async () => {
    const res = await request(app).get("/health/live");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("returns the standard error shape for unknown routes", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(errorResponseSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.error.code).toBe("not_found");
    expect(res.body.error.requestId).toBe(res.headers["x-request-id"]);
  });

  it("returns malformed_request for invalid JSON", async () => {
    const res = await request(app)
      .post("/health/live")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("malformed_request");
  });

  it("does not allow an unlisted CORS origin", async () => {
    const res = await request(app).get("/health/live").set("Origin", "http://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
