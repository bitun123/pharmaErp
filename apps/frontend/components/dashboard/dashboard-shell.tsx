"use client";

import * as React from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { WelcomeHeading } from "@/components/dashboard/welcome-heading";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { CurrentUser } from "@/lib/user";

export function DashboardShell({
  children,
  user,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  user: CurrentUser;
  defaultOpen?: boolean;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar user={user} />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <WelcomeHeading name={user.name} />
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 lg:p-4">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
