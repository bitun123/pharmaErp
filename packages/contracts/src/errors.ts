import { z } from "zod";

// Stable machine-readable error codes (API.md Section 3.3).
// Codes are added here only when an endpoint in API.md needs them.
export const ERROR_CODES = [
  "malformed_request",
  "validation_failed",
  "unauthenticated",
  "session_expired",
  "forbidden",
  "not_found",
  "payload_too_large",
  "unsupported_media_type",
  "rate_limited",
  "csrf_invalid",
  "internal_error",
  "service_unavailable",
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const fieldErrorSchema = z.object({
  field: z.string(),
  code: z.string(),
  message: z.string(),
});
export type FieldError = z.infer<typeof fieldErrorSchema>;

// The single error response shape used by every non-2xx response.
export const errorResponseSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    fieldErrors: z.array(fieldErrorSchema).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string(),
  }),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
