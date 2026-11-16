"use client";

import { useState, type ReactNode } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client";
import { getErrorFriendlyMessage } from "@/lib/errorFriendlyMessage";

/** Global API error toast. Opt out per query/mutation with `meta: { silent: true }`. */
function notifyError(error: unknown, meta?: Record<string, unknown>) {
  if (meta?.silent) return;
  toast.add({ type: "error", title: getErrorFriendlyMessage(error) });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState so each browser session gets one client (never shared between requests on the server).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => notifyError(error, query.meta),
        }),
        mutationCache: new MutationCache({
          onError: (error, _vars, _ctx, mutation) => notifyError(error, mutation.meta),
        }),
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            // Retry once for network/5xx failures, never for 4xx.
            retry: (count, error) =>
              count < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
          },
          mutations: { retry: false },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
