"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  ArrowRight,
  IdCard,
  BriefcaseMedical,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Moon,
  Sun,
} from "lucide-react";
import { FormInput } from "@/components/fromInput/input";
import { signInSchema, type SignInFormData, zodResolver } from "@repo/contracts";

// ========================================================
// SIGN IN PAGE COMPONENT
// ========================================================

export default function SignInPage() {
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    if (typeof document === "undefined") {
      return false;
    }
    return document.documentElement.classList.contains("dark");
  });

  // Setup React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const onSubmit = async (data: SignInFormData) => {
    setGeneralError(null);

    try {
      // Simulated authentication request with edge-case checks
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Test error simulation (e.g. if user enters 'error1234')
      if (data.password === "error1234") {
        setGeneralError("Authentication failed. Invalid credentials or node authorization expired.");
        return;
      }

      setIsSuccess(true);
    } catch {
      setGeneralError("Network connection interrupted. Unable to reach verification node.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground transition-colors">
      {/* ========================================================
          LEFT COLUMN: Hero, Compliance & Brand Information
          ======================================================== */}
      <section className="relative w-full lg:w-1/2 bg-[#005131] dark:bg-[#003d24] text-white p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

        {/* Top Header: Logo & Secure Node Badge */}
        <header className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <BriefcaseMedical className="size-5" />
            </div>
            <div>
              <div className="font-semibold text-xs tracking-wider uppercase">Pharma ERP</div>
              <div className="text-[10px] text-white/70 font-mono tracking-wider">Enterprise Core v4.8</div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-white/90 backdrop-blur-xs">
            <ShieldCheck className="size-3.5 text-emerald-300" />
            <span>Secure Node</span>
          </div>
        </header>

        {/* Middle Content: Title, Value Proposition & Trust Badges */}
        <div className="relative z-10 my-10 lg:my-auto max-w-xl">
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 mb-6">
            Next-Generation Supply & Compliance
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.15] mb-5">
            Clinical Precision.
            <br />
            Global Supply Control.
          </h1>

          <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-8 max-w-lg">
            Authorized access required. Manage batch serialization, cold-chain telemetry, automated DEA reporting, and cross-facility logistics within a unified, high-security ERP environment.
          </p>

          {/* Compliance & Security Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-white/15 text-white shrink-0">
                <Lock className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">256-Bit</div>
                <div className="text-[11px] text-white/70">TLS Encryption</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-white/15 text-white shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">HIPAA & FDA</div>
                <div className="text-[11px] text-white/70">Strict Compliance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer: System Telemetry & Copyright */}
        <footer className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60 font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>System Operational</span>
          </div>
          <div>• Node: US-EAST-PHAR-01</div>
          <div className="w-full sm:w-auto">© 2028 Pharma ERP Global. All rights reserved.</div>
        </footer>
      </section>

      {/* ========================================================
          RIGHT COLUMN: Sign-In Portal Form
          ======================================================== */}
      <main className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Top Right Controls (Theme Toggle) */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
            className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-xs cursor-pointer"
          >
            {isDarkMode ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-foreground/80" />}
          </button>
        </div>

        {/* Centered Sign In Card */}
        <div className="w-full max-w-[420px] bg-card text-card-foreground border border-border rounded-2xl p-7 sm:p-9 shadow-xl shadow-black/5 transition-all">
          {/* Card Shield Badge */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-6 shadow-xs">
            <ShieldCheck className="size-6" />
          </div>

          {/* Form Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Sign In to Portal</h2>
            <p className="text-xs text-muted-foreground mt-1">Authenticate with your professional credentials</p>
          </div>

          {/* Success Banner */}
          {isSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Authentication approved. Redirecting to workspace...</span>
            </div>
          )}

          {/* General Error Banner */}
          {generalError && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{generalError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Field: Identifier (Email or NPI) using reusable FormInput */}
            <FormInput
              label="Professional Email or NPI"
              placeholder="dr.smith@pharma-enterprise.com or NPI"
              autoComplete="username"
              disabled={isSubmitting || isSuccess}
              leftIcon={<IdCard className="size-4" />}
              error={errors.identifier?.message}
              {...register("identifier")}
            />

            {/* Field: Password using reusable FormInput */}
            <FormInput
              label="Password"
              type="password"
              placeholder="••••••••••••"
              autoComplete="current-password"
              disabled={isSubmitting || isSuccess}
              leftIcon={<KeyRound className="size-4" />}
              error={errors.password?.message}
              labelRight={
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    setGeneralError("Password reset instructions have been forwarded to your system administrator.");
                  }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Forgot password?
                </a>
              }
              {...register("password")}
            />

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className="w-full h-11 bg-primary hover:bg-primary/90 active:scale-[0.99] text-primary-foreground font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </form>

          {/* Security Assurance footer on card */}
          <div className="mt-6 pt-4 border-t border-border/60 text-center">
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <Lock className="size-3 text-muted-foreground" />
              <span>Restricted Session • Audit Logged</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
