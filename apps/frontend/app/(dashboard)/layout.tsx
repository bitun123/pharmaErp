import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

// Reads the sidebar's saved open/collapsed state (cookie set by the shadcn sidebar).
async function ShellWithSavedState({ children }: { children: ReactNode }) {
  const store = await cookies();
  const defaultOpen = store.get("sidebar_state")?.value !== "false";
  return <DashboardShell defaultOpen={defaultOpen}>{children}</DashboardShell>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardShell>{children}</DashboardShell>}>
      <ShellWithSavedState>{children}</ShellWithSavedState>
    </Suspense>
  );
}
