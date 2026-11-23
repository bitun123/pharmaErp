"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { WelcomeHeading } from "@/components/dashboard/welcome-heading";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSession } from "@/features/auth/hooks/useHooks";

/**
 * Guards the dashboard on the client: no session -> sign-in,
 * unverified email -> OTP page. Renders a loader or retry UI meanwhile.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();
  const data = session.data;

  const target = session.isPending || session.isError ? null : !data ? "/signin" : !data.user.emailVerified ? "/otpverify" : null;

  React.useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (session.isError) {
    return (
      <div role="alert" className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">We couldn&apos;t load your session. Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => session.refetch()}
          disabled={session.isFetching}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={session.isFetching ? "size-4 animate-spin" : "size-4"} />
          Retry
        </button>
      </div>
    );
  }

  if (session.isPending || target) {
    return (
      <div role="status" aria-label="Loading" className="flex min-h-[60dvh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

export function DashboardShell({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <WelcomeHeading />
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link
                href="/shops/new"
                aria-label="Register New Shop"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-4"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Register New Shop</span>
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 lg:p-4">
            <AuthGate>{children}</AuthGate>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
