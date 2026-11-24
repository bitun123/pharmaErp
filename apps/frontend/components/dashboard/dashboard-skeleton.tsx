import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder with the same dimensions as the real dashboard layout, shown while the
 * server checks the session. It contains no real content, so nothing private is sent
 * before the check, and the page does not jump when the real layout arrives.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex min-h-svh w-full bg-background" role="status" aria-label="Loading">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-2 p-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="size-10 rounded-xl" />
          </div>
        </header>
        <main className="space-y-4 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </main>
      </div>
    </div>
  );
}
