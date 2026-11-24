
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string;
}

export interface AuthSessionDetails {
  id: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthMembership {
  id: string;
  role: string;
  shopId: string | null;
  title: string | null;
  permissions: Record<string, boolean | "all">;
}

export interface AuthSession {
  user: AuthUser;
  session: AuthSessionDetails;
  membership: AuthMembership | null;
}

export type OtpType =
  | "sign-in"
  | "email-verification"
  | "forget-password";

export interface SignInParams {
  identifier: string;
  password: string;
}

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
}

export interface SendOtpParams {
  email: string;
  type: OtpType;
}

export interface VerifyEmailParams {
  email: string;
  otp: string;
}

export interface ResetPasswordParams {
  email: string;
  otp: string;
  password: string;
}

export interface SignInResponse extends AuthSession {}

/**
 * Returned instead of a session when the account needs an emailed sign-in code.
 * No session exists yet: the code is verified with `verifyTwoFactorOtp`.
 */
export interface TwoFactorChallenge {
  twoFactorRedirect: true;
  twoFactorMethods: string[];
}

export type SignInResult = SignInResponse | TwoFactorChallenge;

export interface VerifyTwoFactorParams {
  code: string;
}

export interface SignUpResponse {
  token: string | null;
  user: AuthUser;
}

export interface VerifyEmailResponse {
  status: boolean;
  user: AuthUser | null;
}

export interface SuccessResponse {
  success: boolean;
}
