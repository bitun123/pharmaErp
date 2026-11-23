"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Loader2, LogOut, Store } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession, useSignOut } from "@/features/auth/hooks/useHooks";
import { formatRole, getInitials } from "@/lib/user";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shops", label: "Shop Management", icon: Store },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const session = useSession();
  const signOut = useSignOut();

  // Close the mobile drawer after any navigation (link click, back button, redirect).
  React.useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  const user = session.data?.user;
  const role = formatRole(session.data?.membership?.role ?? user?.role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
        <Link href="/dashboard" aria-label="Pharma ERP home" className="flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <span className="group-data-[collapsible=icon]:hidden">
            <Logo className="h-12" priority />
          </span>
          <span className="hidden group-data-[collapsible=icon]:block">
            <Logo variant="icon" className="size-9 object-contain" priority />
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      tooltip={{ children: label, hidden: isMobile }}
                      isActive={active}
                      className="h-10 text-sm data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary/90 data-active:hover:text-sidebar-primary-foreground"
                      render={<Link href={href} aria-current={active ? "page" : undefined} />}
                    >
                      <Icon className="size-4.5 group-data-[collapsible=icon]:size-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg group-data-[collapsible=icon]:size-8 bg-secondary-container text-xs font-semibold text-secondary-container-foreground"
            aria-hidden
          >
            {session.isPending ? <Skeleton className="size-full rounded-lg" /> : getInitials(user?.name)}
          </div>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            {session.isPending ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ) : (
              <>
                <p className="truncate text-sm font-medium" title={user?.name}>
                  {user?.name ?? "Unknown user"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{role}</p>
              </>
            )}
          </div>

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => signOut.mutate()}
                  disabled={signOut.isPending}
                  aria-label="Sign out"
                  className="flex items-center justify-center rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
                />
              }
            >
              {signOut.isPending ? <Loader2 className="size-4.5 animate-spin" /> : <LogOut className="size-4.5" />}
            </TooltipTrigger>
            <TooltipContent side={isMobile ? "top" : "right"}>Sign out</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
