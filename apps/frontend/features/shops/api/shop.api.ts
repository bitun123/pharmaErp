import { api } from "@/lib/client";
import type { CreateShopInput, CreateShopResponse, ListShopsQuery, PaginatedShopResponse } from "@repo/contracts";

// The shop API on the backend (reached through the same-origin /api rewrite).
const SHOP = "/api/shop";

/** Backend query -> URL parameters. Empty search and the "all" status filter are left out. */
export function toRequestParams(query: ListShopsQuery): Record<string, string> {
  const params: Record<string, string> = {
    page: String(query.page),
    limit: String(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };
  if (query.search) params.search = query.search;
  if (query.isActive && query.isActive !== "all") params.isActive = query.isActive;
  return params;
}

/**
 * One page of shops. Search, filter, sort and paging are all done by the backend.
 * `signal` lets TanStack Query cancel a request that is no longer needed.
 */
export function listShops(query: ListShopsQuery, signal?: AbortSignal) {
  return api.get<PaginatedShopResponse>(SHOP, { params: toRequestParams(query), signal });
}

/**
 * Registers a shop and its admin. Send the `logoFileId` returned by the upload API (never a URL):
 * the backend looks the image up itself.
 */
export function createShop(input: CreateShopInput) {
  return api.post<CreateShopResponse>(SHOP, input);
}
