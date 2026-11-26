"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ListShopsQuery } from "@repo/contracts";
import { listShops } from "../api/shop.api";
import { toListShopsQuery, type ShopListParams } from "../store/shop-list-params";

/**
 * Cache keys for shop data. Later create / update / delete code can invalidate
 * `shopKeys.lists()` to refresh every cached list at once.
 */
export const shopKeys = {
  all: ["shops"] as const,
  lists: () => [...shopKeys.all, "list"] as const,
  list: (query: ListShopsQuery) => [...shopKeys.lists(), query] as const,
};

/**
 * One page of shops for the current search, filter, sort and page.
 * - Each distinct set of params is cached on its own, so going back to a page is instant.
 * - While a new page loads, the previous one stays on screen (`isPlaceholderData` is true),
 *   so the table does not flash empty.
 * - Errors are not toasted: the page shows its own message with a Retry button.
 */
export function useShops(params: ShopListParams) {
  const query = toListShopsQuery(params);

  return useQuery({
    queryKey: shopKeys.list(query),
    queryFn: ({ signal }) => listShops(query, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    meta: { silent: true },
  });
}
