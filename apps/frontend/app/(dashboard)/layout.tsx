import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { requirePermission } from "@/lib/dal";
import { SUPER_ADMIN_AREA_PERMISSION } from "@/lib/permissions";

// Checks the session on the server before anything renders, then reads the sidebar's
// saved open/collapsed state (cookie set by the shadcn sidebar).
async function AuthorizedShell({ children }: { children: ReactNode }) {
  const session = await requirePermission(SUPER_ADMIN_AREA_PERMISSION);
  const store = await cookies();
  const defaultOpen = store.get("sidebar_state")?.value !== "false";

  return (
    <DashboardShell
      defaultOpen={defaultOpen}
      user={{
        name: session.user.name,
        role: session.membership?.role ?? null,
        permissions: session.membership?.permissions ?? {},
      }}
    >
      {children}
    </DashboardShell>
  );
}

// NOTE: layouts do not re-run on client navigation, so every page in this group must
// also call requirePermission() itself (see dashboard/page.tsx).
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AuthorizedShell>{children}</AuthorizedShell>
    </Suspense>
  );
}
