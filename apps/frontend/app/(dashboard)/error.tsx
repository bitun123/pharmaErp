"use client";

import { RefreshCw } from "lucide-react";

/** Shown when the server could not check the session (e.g. backend down). The user stays signed in. */
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t load your account. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <RefreshCw className="size-4" />
        Try again
      </button>
    </div>
  );
}
