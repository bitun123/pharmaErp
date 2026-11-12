import type { ErrorCode, FieldError } from "@pharma/contracts";

// Typed application error: services throw this; the central handler maps it to the
// standard response shape (ARCHITECTURE 12, API.md 3.3).
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: Record<string, unknown> | undefined;
  readonly fieldErrors: FieldError[] | undefined;

  constructor(
    code: ErrorCode,
    status: number,
    message: string,
    details?: Record<string, unknown>,
    fieldErrors?: FieldError[],
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.fieldErrors = fieldErrors;
  }
}

export const notFound = (message = "The requested resource was not found."): AppError =>
  new AppError("not_found", 404, message);

export const validationFailed = (fieldErrors: FieldError[]): AppError =>
  new AppError(
    "validation_failed",
    422,
    "The request contains invalid values.",
    undefined,
    fieldErrors,
  );

// One message for every sign-in failure so the response never reveals whether an account
// exists, is locked or is deactivated (API.md 4.2).
export const SIGN_IN_FAILED_MESSAGE = "The email or password is incorrect.";
export const signInFailed = (): AppError =>
  new AppError("unauthenticated", 401, SIGN_IN_FAILED_MESSAGE);

export const csrfInvalid = (): AppError =>
  new AppError("csrf_invalid", 403, "The request origin is not allowed.");

export const rateLimited = (): AppError =>
  new AppError("rate_limited", 429, "Too many attempts. Please try again later.");
