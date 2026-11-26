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
  OTP_HAS_EXPIRED: "This verification code has expired. Request a new one.",
  INVALID_CODE: "Invalid verification code.",
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "Too many incorrect attempts. Request a new code.",
  ACCOUNT_TEMPORARILY_LOCKED: "Too many failed attempts. Your account is temporarily locked. Try again later.",
  INVALID_TWO_FACTOR_COOKIE: "Your sign-in expired. Please sign in again.",
  SHOP_BLOCKED: "Your shop has been blocked. Please contact your administrator.",
  SHOP_DELETED: "Your shop has been removed. Please contact your administrator.",
  TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Request a new code.",
  // Image upload (backend media module)
  FILE_TOO_LARGE: "This image is too large. The maximum size is 5 MB.",
  INVALID_FILE_TYPE: "Only JPEG, PNG, WEBP and GIF images are allowed.",
  INVALID_FILE_CONTENT: "This file is not a valid image.",
  EMPTY_FILE: "This file is empty.",
  NO_FILE_PROVIDED: "Please choose an image to upload.",
  UNEXPECTED_FIELD: "The image could not be uploaded. Please try again.",
  INVALID_FOLDER: "The image could not be uploaded. Please try again.",
  UPLOAD_ERROR: "The image could not be uploaded. Please try again.",
  IMAGEKIT_UPLOAD_ERROR: "The image could not be uploaded. Please try again.",
  IMAGEKIT_NOT_CONFIGURED: "Image uploads are not available right now. Please contact support.",
  FILE_NOT_FOUND: "That image no longer exists.",
  FILE_IN_USE: "This image is in use and cannot be removed.",
};

/** Turns anything thrown by the api client into a user-facing message. */
export function getErrorFriendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!;
    if (error.status === 0) return "Unable to reach the server. Check your connection.";
    if (error.status === 413) return "This file is too large to upload.";
    if (error.status === 429) return "Too many requests. Please wait a moment and try again.";
    if (error.status === 401) return "Incorrect email or password.";
    if (error.status >= 500) return "Something went wrong on our side. Please try again.";
    if (error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}
