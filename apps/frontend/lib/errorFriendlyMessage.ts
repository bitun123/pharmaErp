import { ApiError } from "@/lib/client";

/** Server error codes (Better Auth) -> messages that are safe to show in the UI. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password.",
  INVALID_PASSWORD: "Incorrect email or password.",
  USER_NOT_FOUND: "Incorrect email or password.", // don't reveal if account exists
  USER_ALREADY_EXISTS: "An account with this email already exists.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists.",
  EMAIL_NOT_VERIFIED: "Please verify your email before signing in.",
  INVALID_EMAIL: "Enter a valid email address.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  PASSWORD_TOO_LONG: "Password must not exceed 128 characters.",
  INVALID_OTP: "Invalid verification code.",
  OTP_EXPIRED: "This verification code has expired. Request a new one.",
  SHOP_BLOCKED: "Your shop has been blocked. Please contact your administrator.",
  SHOP_DELETED: "Your shop has been removed. Please contact your administrator.",
  TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Request a new code.",
};

/** Turns anything thrown by the api client into a user-facing message. */
export function getErrorFriendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!;
    if (error.status === 0) return "Unable to reach the server. Check your connection.";
    if (error.status === 429) return "Too many requests. Please wait a moment and try again.";
    if (error.status === 401) return "Incorrect email or password.";
    if (error.status >= 500) return "Something went wrong on our side. Please try again.";
    if (error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}
