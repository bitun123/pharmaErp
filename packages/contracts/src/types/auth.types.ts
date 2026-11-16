export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string;
}

export interface AuthSession {
  user: AuthUser;
  session: { id: string; expiresAt: string };
}

export type OtpType = "sign-in" | "email-verification" | "forget-password";

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

export interface SignInResponse {
  redirect: boolean;
  token: string;
  user: AuthUser;
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
