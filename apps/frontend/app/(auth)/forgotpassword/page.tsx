"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { FormInput } from "@/components/fromInput/input";
import { useResetPassword, useSendResetCode } from "@/features/auth/hooks/useHooks";
import { maskEmail } from "@/lib/user";

const RESEND_SECONDS = 30;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailForm = { email: string };
type ResetForm = { otp: string; password: string; confirmPassword: string };

export default function ForgotPasswordPage() {
  const sendCode = useSendResetCode();
  const reset = useResetPassword();

  // Step 1 = enter email, step 2 = enter code + new password.
  const [email, setEmail] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  const emailForm = useForm<EmailForm>({ defaultValues: { email: "" } });
  const resetForm = useForm<ResetForm>({
    defaultValues: { otp: "", password: "", confirmPassword: "" },
  });

  // Resend countdown.
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onSendCode = async (data: EmailForm) => {
    const value = data.email.trim().toLowerCase();
    try {
      await sendCode.mutateAsync(value);
      setEmail(value);
      setCooldown(RESEND_SECONDS);
    } catch {
      // The error is shown by the global toast.
    }
  };

  const onResend = async () => {
    if (!email || cooldown > 0 || sendCode.isPending) return;
    try {
      await sendCode.mutateAsync(email);
      resetForm.setValue("otp", "");
      setCooldown(RESEND_SECONDS);
      resetForm.setFocus("otp");
    } catch {
      // The error is shown by the global toast.
    }
  };

  const onReset = async (data: ResetForm) => {
    if (!email) return;
    try {
      await reset.mutateAsync({ email, otp: data.otp, password: data.password });
    } catch {
      // The error is shown by the global toast. Clear the (likely wrong) code.
      resetForm.setValue("otp", "");
      resetForm.setFocus("otp");
    }
  };

  const changeEmail = () => {
    setEmail(null);
    setCooldown(0);
    resetForm.reset();
    sendCode.reset();
    reset.reset();
  };

  const busy = reset.isPending || reset.isSuccess;

  return (
    <AuthCard
      title={email === null ? "Forgot password?" : "Reset your password"}
      subtitle={
        email === null
          ? "Enter your email and we'll send you a reset code."
          : `Enter the 6-digit code sent to ${maskEmail(email)} and choose a new password.`
      }
    >
        {email === null ? (
          <>
            <form onSubmit={emailForm.handleSubmit(onSendCode)} noValidate className="space-y-4">
              <FormInput
                label="Email"
                type="email"
                placeholder="example@gmail.com"
                autoComplete="email"
                autoFocus
                disabled={sendCode.isPending}
                leftIcon={<Mail className="size-4" />}
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register("email", {
                  required: "Email is required.",
                  validate: (v) => EMAIL_REGEX.test(v.trim()) || "Enter a valid email address.",
                })}
              />

              <button
                type="submit"
                disabled={sendCode.isPending}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendCode.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Send reset code</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <form onSubmit={resetForm.handleSubmit(onReset)} noValidate className="space-y-4">
              <FormInput
                label="Verification code"
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                disabled={busy}
                leftIcon={<KeyRound className="size-4" />}
                error={resetForm.formState.errors.otp?.message}
                {...resetForm.register("otp", {
                  required: "Enter the 6-digit code.",
                  pattern: { value: /^\d{6}$/, message: "Enter the 6-digit code." },
                  // Keep digits only (handles paste of "123 456" etc.).
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  },
                })}
              />

              <FormInput
                label="New password"
                type="password"
                autoComplete="new-password"
                disabled={busy}
                leftIcon={<Lock className="size-4" />}
                error={resetForm.formState.errors.password?.message}
                {...resetForm.register("password", {
                  required: "Password is required.",
                  minLength: { value: 8, message: "Password must be at least 8 characters." },
                  maxLength: { value: 128, message: "Password must not exceed 128 characters." },
                })}
              />

              <FormInput
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                disabled={busy}
                leftIcon={<Lock className="size-4" />}
                error={resetForm.formState.errors.confirmPassword?.message}
                {...resetForm.register("confirmPassword", {
                  required: "Confirm your password.",
                  validate: (v, values) => v === values.password || "Passwords do not match.",
                })}
              />

              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset password</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={onResend}
                disabled={cooldown > 0 || sendCode.isPending || busy}
                className="hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendCode.isPending
                  ? "Sending..."
                  : cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : "Resend code"}
              </button>
              <button
                type="button"
                onClick={changeEmail}
                disabled={busy}
                className="hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                Change email
              </button>
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/signin"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-3" />
            <span>Back to sign in</span>
          </Link>
        </div>
    </AuthCard>
  );
}
