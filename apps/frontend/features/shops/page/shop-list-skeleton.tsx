import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder rows with the same height as real rows, so nothing jumps when data arrives. */
export function ShopRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading shops" className="divide-y divide-border/60 border-t border-border/60">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-3 w-28 max-w-full" />
          </div>
          <Skeleton className="hidden h-5 w-20 md:block" />
          <Skeleton className="hidden h-8 w-36 lg:block" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
