import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

/** Shared card used by every auth page (sign in, OTP, forgot password). */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[380px] rounded-xl border border-transparent bg-card p-5 text-card-foreground shadow-xl shadow-foreground/5 sm:p-8 dark:border-border">
      <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ShieldCheck className="size-6" />
      </div>

      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground text-balance">{subtitle}</p>}
      </div>

      {children}
    </div>
  );
}
