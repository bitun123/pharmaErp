"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/hooks/useHooks";

export function WelcomeHeading() {
  const { data, isPending } = useSession();
  const name = data?.user.name?.trim();

  return (
    <h1 className="min-w-0 truncate border-l-2 border-primary pl-3 text-sm font-semibold tracking-tight sm:text-base">
      {isPending ? <Skeleton className="h-6 w-48 max-w-full" /> : name ? `Welcome back, ${name}` : "Welcome back"}
    </h1>
  );
}
