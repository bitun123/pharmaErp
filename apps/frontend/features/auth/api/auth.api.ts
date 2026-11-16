import { api, ApiError } from "@/lib/client";
import { getErrorFriendlyMessage } from "@/lib/errorFriendlyMessage";
import type {
  AuthSession,
  ResetPasswordParams,
  SendOtpParams,
  SignInParams,
  SignInResponse,
  SignUpParams,
  SignUpResponse,
  SuccessResponse,
  VerifyEmailParams,
  VerifyEmailResponse,
} from "@repo/contracts";

// Better Auth is mounted at /api/auth on the backend.
const AUTH = "/api/auth";

/** Auth-specific alias so UI code can import everything from this file. */
export const getAuthErrorMessage = getErrorFriendlyMessage;

const NPI_REGEX = /^\d{10}$/;

// ---------- Calls ----------

/**
 * Sign in with email + password.
 * NOTE: the backend only supports email sign-in; NPI login needs a backend lookup first.
 */
export async function signIn(params: SignInParams) {
  const identifier = params.identifier.trim();

  if (NPI_REGEX.test(identifier)) {
    throw new ApiError("Sign-in with NPI is not available yet. Use your email.", 400);
  }

  return api.post<SignInResponse>(
    `${AUTH}/sign-in/email`,
    { email: identifier.toLowerCase(), password: params.password },
  );
}

export function signUp(params: SignUpParams) {
  return api.post<SignUpResponse>(`${AUTH}/sign-up/email`, {
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    password: params.password,
  });
}

export function signOut() {
  // Body must be valid JSON because the client sends Content-Type: application/json.
  return api.post<SuccessResponse>(`${AUTH}/sign-out`, {});
}

/**
 * Current session, or null when signed out.
 * Better Auth returns 200 with a null body for no session, and a 401 is also treated as "none".
 * Real failures (network / 5xx) still throw so callers don't mistake an outage for a logout.
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    return (await api.get<AuthSession | null>(`${AUTH}/get-session`)) ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function sendOtp(params: SendOtpParams) {
  return api.post<SuccessResponse>(`${AUTH}/email-otp/send-verification-otp`, {
    email: params.email.trim().toLowerCase(),
    type: params.type,
  });
}

export function verifyEmail(params: VerifyEmailParams) {
  return api.post<VerifyEmailResponse>(`${AUTH}/email-otp/verify-email`, {
    email: params.email.trim().toLowerCase(),
    otp: params.otp.trim(),
  });
}

export function resetPassword(params: ResetPasswordParams) {
  return api.post<SuccessResponse>(`${AUTH}/email-otp/reset-password`, {
    email: params.email.trim().toLowerCase(),
    otp: params.otp.trim(),
    password: params.password,
  });
}
