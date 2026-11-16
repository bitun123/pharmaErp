"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowRight, CheckCircle2, IdCard, KeyRound, Loader2, Lock } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { FormInput } from "@/components/fromInput/input";
import { useSignIn } from "@/features/auth/hooks/useHooks";
import { signInSchema, type SignInFormData, zodResolver } from "@repo/contracts";

export default function SignInPage() {
  const signIn = useSignIn();
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      await signIn.mutateAsync(data);
      setIsSuccess(true);
    } catch {
      // The error is shown by the global toast.
    }
  };

  const disabled = isSubmitting || isSuccess;

  return (
    <AuthCard title="Sign In to Portal" subtitle="Authenticate with your professional credentials">
      {isSuccess && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/10 p-3.5 text-xs text-primary"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Credentials verified. Sending your verification code...</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormInput
          label="Professional Email "
          placeholder="dr.smith@pharma-enterprise.com"
          autoComplete="username"
          disabled={disabled}
          leftIcon={<IdCard className="size-4" />}
          error={errors.identifier?.message}
          {...register("identifier")}
        />

        <FormInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={disabled}
          leftIcon={<KeyRound className="size-4" />}
          error={errors.password?.message}
          labelRight={
            <Link
              href="/forgotpassword"
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          }
          {...register("password")}
        />

        <button
          type="submit"
          disabled={disabled}
          className="mt-1 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 border-t border-border pt-3 text-center">
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="size-3" />
          <span>Restricted Session • Audit Logged</span>
        </p>
      </div>
    </AuthCard>
  );
}
