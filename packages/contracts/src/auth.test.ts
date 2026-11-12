import { describe, expect, it } from "vitest";
import { PASSWORD_MAX_LENGTH, signInRequestSchema } from "./auth.ts";

describe("signInRequestSchema", () => {
  it("trims and lower-cases the email", () => {
    const parsed = signInRequestSchema.parse({ email: "  Admin@Example.COM ", password: "x" });
    expect(parsed.email).toBe("admin@example.com");
  });

  it("rejects an invalid email, empty password and oversize password", () => {
    expect(signInRequestSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(signInRequestSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(
      signInRequestSchema.safeParse({
        email: "a@b.co",
        password: "x".repeat(PASSWORD_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });

  it("rejects unknown fields and non-string values", () => {
    expect(
      signInRequestSchema.safeParse({ email: "a@b.co", password: "x", rememberMe: true }).success,
    ).toBe(false);
    expect(signInRequestSchema.safeParse({ email: ["a@b.co"], password: "x" }).success).toBe(false);
  });
});
