"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
} from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { FormInput } from "@/components/fromInput/input";
import {
  useSendOtp,
  useSession,
  useSignOut,
  useVerifyEmail,
} from "@/features/auth/hooks/useHooks";
import { otpSchema, type OtpFormData, zodResolver } from "@repo/contracts";

const RESEND_SECONDS = 30;

/** dr.smith@pharma.com -> d***@pharma.com */
function maskEmail(email: string) {
  const [name = "", domain = ""] = email.split("@");
  return `${name.slice(0, 1)}***@${domain}`;
}

export default function OtpVerifyPage() {
  const router = useRouter();
  const session = useSession();
  const verify = useVerifyEmail();
  const resend = useSendOtp();
  const signOut = useSignOut();

  const email = session.data?.user.email;

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

  // No session means the user skipped sign-in (or it expired): go back.
  React.useEffect(() => {
    if (!session.isPending && !session.isError && !session.data) {
      router.replace("/signin");
    }
  }, [session.isPending, session.isError, session.data, router]);

  // Resend countdown.
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onSubmit = async (data: OtpFormData) => {
    if (!email) return;
    try {
      await verify.mutateAsync({ email, otp: data.otp });
    } catch {
      // The error is shown by the global toast; clear the wrong code.
      setValue("otp", "");
      setFocus("otp");
    }
  };

  const onResend = async () => {
    if (!email || cooldown > 0 || resend.isPending) return;
    verify.reset();
    try {
      await resend.mutateAsync({ email, type: "email-verification" });
      setValue("otp", "");
      setCooldown(RESEND_SECONDS);
      setFocus("otp");
    } catch {
      // The error is shown by the global toast.
    }
  };

  const busy = isSubmitting || verify.isSuccess;

  // Session still loading, or redirecting to sign-in.
  if (session.isPending || (!session.isError && !session.data)) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  // Could not load the session (network / server).
  if (session.isError) {
    return (
      <div className="flex items-center justify-center py-10">
        <div role="alert" className="max-w-[420px] text-center space-y-4">
          <p className="text-sm text-destructive">
            We couldn&apos;t check your session. Please try again.
          </p>
          <button
            type="button"
            onClick={() => session.refetch()}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthCard
      title="Verify your identity"
      subtitle={`Enter the 6-digit code sent to ${email ? maskEmail(email) : "your email"}`}
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
            disabled={busy || !email}
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
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending || busy}
            className="hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            Use a different account
          </button>
        </div>
    </AuthCard>
  );
}
