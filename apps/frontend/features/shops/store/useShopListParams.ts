"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildShopListSearch,
  parseShopListParams,
  type ShopListParams,
  type ShopSort,
  type ShopStatusFilter,
} from "./shop-list-params";

/**
 * The shop list's state, kept in the URL. Components read `params` and call the setters;
 * nothing else needs to know about the address bar.
 * Note: useSearchParams needs a <Suspense> boundary above the component that uses this hook.
 */
export function useShopListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(() => parseShopListParams(searchParams), [searchParams]);

  const update = useCallback(
    (patch: Partial<ShopListParams>, mode: "push" | "replace") => {
      const next = { ...params, ...patch };
      router[mode](`${pathname}${buildShopListSearch(next)}`, { scroll: false });
    },
    [params, pathname, router],
  );

  return {
    params,
    // Typing in the search box would flood the history, so it replaces the entry instead.
    setSearch: useCallback((search: string) => update({ search, page: 1 }, "replace"), [update]),
    setStatus: useCallback((status: ShopStatusFilter) => update({ status, page: 1 }, "push"), [update]),
    setSort: useCallback((sort: ShopSort) => update({ sort, page: 1 }, "push"), [update]),
    // `replace` is for corrections (e.g. a page past the end), so Back does not bounce the user around.
    setPage: useCallback(
      (page: number, mode: "push" | "replace" = "push") => update({ page: Math.max(1, Math.floor(page)) }, mode),
      [update],
    ),
    reset: useCallback(() => router.push(pathname, { scroll: false }), [pathname, router]),
  };
}
