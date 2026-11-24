"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { maskEmail } from "@/lib/user";
import {
  getSession,
  isTwoFactorChallenge,
  resetPassword,
  sendOtp,
  sendTwoFactorOtp,
  signIn,
  signOut,
  signUp,
  verifyTwoFactorOtp,
} from "../api/auth.api";
import { clearPendingOtpEmail, savePendingOtpEmail } from "../pending-otp";

// API errors are shown as toasts globally (see QueryProvider),
// so the hooks below only add success toasts and navigation.

export const authKeys = {
  session: ["auth", "session"] as const,
};

// "(auth)" is a route group, so it is not part of the URL.
const SIGN_IN_PATH = "/signin";
const OTP_PATH = "/otpverify";
const DASHBOARD_PATH = "/dashboard";

/** Current session. `data` is null when signed out. */
export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: getSession,
    retry: false,
    meta: { silent: true }, // callers render their own retry UI
  });
}

/**
 * Step 1 of login: email + password. Normally the server answers "code pending": no session
 * exists yet, so the code is emailed and the user goes to the OTP page. If the email fails
 * to send, the OTP page's "Resend" button covers it, so that does not block navigation.
 * Accounts without the code requirement get their session right away.
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: signIn,
    onSuccess: async (result, variables) => {
      if (!isTwoFactorChallenge(result)) {
        await queryClient.invalidateQueries({ queryKey: authKeys.session });
        router.replace(DASHBOARD_PATH);
        router.refresh();
        return;
      }

      savePendingOtpEmail(maskEmail(variables.identifier.trim().toLowerCase()));
      const sent = await sendTwoFactorOtp()
        .then(() => true)
        .catch(() => false);
      toast.add(
        sent
          ? { type: "success", title: "Password accepted", description: "We emailed you a verification code." }
          : { type: "warning", title: "Password accepted", description: "We couldn't send the code. Use Resend on the next screen." },
      );
      router.replace(OTP_PATH);
    },
  });
}

/** Creates the account. Verification (OTP) is left to the caller. */
export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signUp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.session }),
  });
}

/**
 * Signs out. The local cache is cleared and the user is sent to sign-in
 * even if the request fails, so a stale session never stays on screen.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: signOut,
    onSettled: () => {
      queryClient.clear();
      router.replace(SIGN_IN_PATH);
      router.refresh();
    },
  });
}

/** Emails a fresh sign-in code (needs the "code pending" cookie). */
export function useSendTwoFactorOtp() {
  return useMutation({
    mutationFn: sendTwoFactorOtp,
    onSuccess: () => toast.add({ type: "success", title: "A new code has been sent." }),
  });
}

/** Step 2 of login: check the emailed code. The server starts the session, then we go to the dashboard. */
export function useVerifyTwoFactor() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: verifyTwoFactorOtp,
    onSuccess: async () => {
      clearPendingOtpEmail();
      await queryClient.invalidateQueries({ queryKey: authKeys.session });
      toast.add({ type: "success", title: "Verified", description: "Redirecting to dashboard..." });
      router.replace(DASHBOARD_PATH);
      router.refresh();
    },
  });
}

/** Emails a password-reset code. The message is neutral so it never reveals whether the account exists. */
export function useSendResetCode() {
  return useMutation({
    mutationFn: (email: string) => sendOtp({ email, type: "forget-password" }),
    onSuccess: () =>
      toast.add({ type: "success", title: "If an account exists, a reset code has been sent." }),
  });
}

/** Sets the new password with the emailed code, then goes to sign-in. */
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.add({ type: "success", title: "Password updated. Please sign in." });
      router.replace(SIGN_IN_PATH);
    },
  });
}
