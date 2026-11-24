"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { FormInput } from "@/components/fromInput/input";
import { useSendTwoFactorOtp, useVerifyTwoFactor } from "@/features/auth/hooks/useHooks";
import { clearPendingOtpEmail, usePendingOtpEmail } from "@/features/auth/pending-otp";
import { ApiError } from "@/lib/client";
import { otpSchema, type OtpFormData, zodResolver } from "@repo/contracts";

const RESEND_SECONDS = 30;

/** Second step of sign-in: the emailed 6-digit code. There is no session yet at this point. */
export function OtpForm() {
  const router = useRouter();
  const verify = useVerifyTwoFactor();
  const resend = useSendTwoFactorOtp();
  const maskedEmail = usePendingOtpEmail();

  const [cooldown, setCooldown] = React.useState(RESEND_SECONDS);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    mode: "onSubmit",
    defaultValues: { otp: "" },
  });

  // Resend countdown.
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const backToSignIn = React.useCallback(() => {
    clearPendingOtpEmail();
    router.replace("/signin");
  }, [router]);

  // The "code pending" cookie is gone or expired: the user must start again from the password step.
  const handleError = (error: unknown) => {
    if (error instanceof ApiError && error.code === "INVALID_TWO_FACTOR_COOKIE") {
      backToSignIn();
      return;
    }
    // Other errors are shown by the global toast; clear the wrong code.
    setValue("otp", "");
    setFocus("otp");
  };

  const onSubmit = async (data: OtpFormData) => {
    try {
      await verify.mutateAsync({ code: data.otp });
    } catch (error) {
      handleError(error);
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || resend.isPending) return;
    verify.reset();
    try {
      await resend.mutateAsync();
      setValue("otp", "");
      setCooldown(RESEND_SECONDS);
      setFocus("otp");
    } catch (error) {
      handleError(error);
    }
  };

  const busy = isSubmitting || verify.isSuccess;

  return (
    <AuthCard
      title="Verify your identity"
      subtitle={`Enter the 6-digit code sent to ${maskedEmail ?? "your email"}`}
    >
      {verify.isSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs flex items-center gap-2.5">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Verified. Redirecting to dashboard...</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormInput
          label="Verification code"
          placeholder="123456"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          disabled={busy}
          leftIcon={<KeyRound className="size-4" />}
          error={errors.otp?.message}
          {...register("otp", {
            // Keep digits only (handles paste of "123 456" etc.).
            onChange: (e) => {
              e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
            },
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
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0 || resend.isPending || busy}
          className="hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resend.isPending
            ? "Sending..."
            : cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Resend code"}
        </button>
        <button
          type="button"
          onClick={backToSignIn}
          disabled={busy}
          className="hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
        >
          Use a different account
        </button>
      </div>
    </AuthCard>
  );
}
