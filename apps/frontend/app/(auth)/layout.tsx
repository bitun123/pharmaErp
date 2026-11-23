import type { ReactNode } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Shared shell for all auth pages.
 * Large screens: brand panel on the left, page content on the right.
 * Below `lg` the brand panel is hidden and only the page content is shown.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh w-full bg-background text-foreground lg:grid-cols-2">
      {/* LEFT: brand panel (desktop only) */}
      <section className="relative hidden overflow-hidden bg-linear-to-br from-hero-from to-hero-to p-12 text-hero-foreground lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-primary/10 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between gap-4">
          <Logo theme="dark" className="h-12" priority />

          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase">
            <ShieldCheck className="size-3.5" />
            <span>Secure Node</span>
          </div>
        </header>

        <div className="relative z-10 my-10 max-w-xl">
          <div className="mb-6 inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            Next-Generation Supply &amp; Compliance
          </div>
          <h2 className="mb-5 text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
            Clinical Precision.
            <br />
            Global Supply Control.
          </h2>
          <p className="mb-8 max-w-lg text-base leading-relaxed opacity-80">
            Authorized access required. Manage batch serialization, cold-chain telemetry, automated
            DEA reporting, and cross-facility logistics within a unified, high-security ERP
            environment.
          </p>

          <div className="grid max-w-md grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3.5">
              <div className="shrink-0 rounded-lg bg-white/10 p-2">
                <Lock className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">256-Bit</div>
                <div className="text-[11px] opacity-70">TLS Encryption</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3.5">
              <div className="shrink-0 rounded-lg bg-white/10 p-2">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">HIPAA &amp; FDA</div>
                <div className="text-[11px] opacity-70">Strict Compliance</div>
              </div>
            </div>
          </div>
        </div>

        <footer className="relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 font-mono text-xs opacity-70">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            <span>System Operational</span>
          </div>
          <div>Node: US-EAST-PHAR-01</div>
          <div>© 2028 Pharma ERP Global. All rights reserved.</div>
        </footer>
      </section>

      {/* RIGHT: page content */}
      <main className="relative flex min-w-0 flex-col items-center justify-center px-4 py-6 sm:px-8">
        <ThemeToggle className="absolute top-4 right-4 sm:top-6 sm:right-6" />

        {/* Compact brand, shown only when the brand panel is hidden */}
        <div className="mb-4 lg:hidden">
          <Logo className="h-12" priority />
        </div>

        {children}
      </main>
    </div>
  );
}
