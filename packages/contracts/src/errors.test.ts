import { describe, expect, it } from "vitest";
import { errorResponseSchema } from "./errors.ts";

describe("errorResponseSchema", () => {
  it("accepts the standard error shape", () => {
    const parsed = errorResponseSchema.safeParse({
      error: { code: "not_found", message: "Not found.", requestId: "req-1" },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown error code", () => {
    const parsed = errorResponseSchema.safeParse({
      error: { code: "made_up", message: "x", requestId: "req-1" },
    });
    expect(parsed.success).toBe(false);
  });
});
