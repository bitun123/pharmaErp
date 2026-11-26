"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, Loader2, Plus, RefreshCw, SearchX, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/client";
import { getErrorFriendlyMessage } from "@/lib/errorFriendlyMessage";
import { useShops } from "../hooks/useShops";
import {
  buildShopListSearch,
  clampPage,
  hasActiveFilters,
} from "../store/shop-list-params";
import { useShopListParams } from "../store/useShopListParams";
import { ShopFilters } from "./shop-filters";
import { ShopRegisterSheet } from "./shop-register-sheet";
import { ShopRowsSkeleton } from "./shop-list-skeleton";
import { ShopPagination } from "./shop-pagination";
import { ShopTable } from "./shop-table";

const CARD =
  "overflow-hidden rounded-2xl bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_6px_20px_rgba(15,23,42,0.07)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.5),0_6px_20px_rgba(0,0,0,0.35)]";

function describeError(error: unknown): { message: string; signIn: boolean } {
  if (error instanceof ApiError && error.status === 401) {
    return { message: "Your session has expired. Please sign in again.", signIn: true };
  }
  if (error instanceof ApiError && error.status === 403) {
    return { message: "You don't have permission to view shops.", signIn: false };
  }
  return { message: getErrorFriendlyMessage(error), signIn: false };
}

function StateMessage({
  icon: Icon,
  title,
  text,
  children,
  role,
}: {
  icon: typeof Store;
  title: string;
  text: string;
  children?: React.ReactNode;
  role?: "alert";
}) {
  return (
    <div role={role} className="flex flex-col items-center gap-3 border-t border-border/60 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      </div>
      {children}
    </div>
  );
}

/** Shop Management: the full shop list with server-side search, status filter, sort and paging. */
export function ShopListPage({ canCreate = false }: { canCreate?: boolean }) {
  const pathname = usePathname();
  const [registerOpen, setRegisterOpen] = React.useState(false);
  const { params, setSearch, setStatus, setSort, setPage, reset } = useShopListParams();
  const { data, error, isPending, isError, isFetching, isPlaceholderData, refetch } = useShops(params);

  const filtersOn = hasActiveFilters(params);
  const shops = data?.data ?? [];
  const pagination = data?.pagination;

  // A page past the end (e.g. shops were removed elsewhere, or a hand-edited URL) moves to the last page.
  // `replace` so the Back button does not bounce between the bad and the corrected page.
  React.useEffect(() => {
    if (!pagination || isPlaceholderData) return;
    const fixed = clampPage(params.page, pagination.totalPages);
    if (fixed !== params.page) setPage(fixed, "replace");
  }, [pagination, isPlaceholderData, params.page, setPage]);

  const hrefForPage = (page: number) => `${pathname}${buildShopListSearch({ ...params, page })}`;

  let body: React.ReactNode;
  if (isPending) {
    body = <ShopRowsSkeleton />;
  } else if (isError) {
    const { message, signIn } = describeError(error);
    body = (
      <StateMessage icon={AlertCircle} title="Couldn't load shops" text={message} role="alert">
        {signIn ? (
          <Link href="/signin" className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Sign in
          </Link>
        ) : (
          <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            Try again
          </Button>
        )}
      </StateMessage>
    );
  } else if (shops.length === 0) {
    body = filtersOn ? (
      <StateMessage icon={SearchX} title="No shops match your search" text="Try a different name or code, or clear the filters.">
        <Button type="button" variant="outline" onClick={reset}>Clear filters</Button>
      </StateMessage>
    ) : (
      <StateMessage icon={Store} title="No shops yet" text="Shops you register will appear here." />
    );
  } else {
    body = <ShopTable shops={shops} busy={isPlaceholderData} />;
  }

  return (
    <section className={CARD} aria-label="Shop Management">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="text-base font-semibold sm:text-lg">Shop Management</h1>
          {pagination && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {pagination.total} {pagination.total === 1 ? "shop" : "shops"}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {isFetching && !isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Updating" />}
          {canCreate && (
            <button
              type="button"
              onClick={() => setRegisterOpen(true)}
              aria-label="Register New Shop"
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:px-4"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Register New Shop</span>
            </button>
          )}
        </div>
      </div>

      <ShopFilters
        params={params}
        hasFilters={filtersOn}
        onSearch={setSearch}
        onStatus={setStatus}
        onSort={setSort}
        onReset={reset}
      />

      {body}

      {pagination && shops.length > 0 && (
        <ShopPagination pagination={pagination} hrefForPage={hrefForPage} onPageChange={(page) => setPage(page)} />
      )}

      {canCreate && <ShopRegisterSheet open={registerOpen} onOpenChange={setRegisterOpen} />}

      {/* Announces result changes to screen readers */}
      <p className="sr-only" aria-live="polite">
        {pagination && !isPlaceholderData ? `${pagination.total} shops found` : ""}
      </p>
    </section>
  );
}
