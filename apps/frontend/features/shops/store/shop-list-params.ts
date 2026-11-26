import { z } from "zod";
import { listShopsQuerySchema, type ListShopsQuery } from "@repo/contracts";

/**
 * The shop list's filters, search, sort and page. They live in the URL (so refresh, the back
 * button and shared links all work). Everything here is plain functions with no React,
 * so the rules can be tested on their own.
 */

export const PAGE_SIZE = 10;
export const SEARCH_MAX_LENGTH = 100;
const MAX_PAGE = 100_000;

export const STATUS_OPTIONS = [
  { value: "all", label: "All shops", isActive: "all" },
  { value: "active", label: "Active", isActive: "true" },
  { value: "blocked", label: "Blocked", isActive: "false" },
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first", sortBy: "createdAt", sortOrder: "desc" },
  { value: "oldest", label: "Oldest first", sortBy: "createdAt", sortOrder: "asc" },
  { value: "name-asc", label: "Name A to Z", sortBy: "name", sortOrder: "asc" },
  { value: "name-desc", label: "Name Z to A", sortBy: "name", sortOrder: "desc" },
  { value: "code", label: "Shop code", sortBy: "shopCode", sortOrder: "asc" },
] as const;

export type ShopStatusFilter = (typeof STATUS_OPTIONS)[number]["value"];
export type ShopSort = (typeof SORT_OPTIONS)[number]["value"];

export type ShopListParams = {
  search: string;
  status: ShopStatusFilter;
  sort: ShopSort;
  page: number;
};

export const SHOP_LIST_DEFAULTS: ShopListParams = {
  search: "",
  status: "all",
  sort: "newest",
  page: 1,
};

// Every field falls back to its default on bad input, so a hand-edited URL can never break the page.
const urlSchema = z.object({
  q: z.string().trim().max(SEARCH_MAX_LENGTH).catch(""),
  status: z.enum(STATUS_OPTIONS.map((o) => o.value) as [ShopStatusFilter, ...ShopStatusFilter[]]).catch("all"),
  sort: z.enum(SORT_OPTIONS.map((o) => o.value) as [ShopSort, ...ShopSort[]]).catch("newest"),
  page: z.coerce.number().int().positive().max(MAX_PAGE).catch(1),
});

type SearchParamsLike = { get(name: string): string | null };

/** URL -> params. Missing, repeated or invalid values become the defaults. */
export function parseShopListParams(searchParams: SearchParamsLike): ShopListParams {
  const parsed = urlSchema.parse({
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });
  return { search: parsed.q, status: parsed.status, sort: parsed.sort, page: parsed.page };
}

/** params -> "?q=..." (only values that differ from the defaults), or "" when nothing is set. */
export function buildShopListSearch(params: ShopListParams): string {
  const out = new URLSearchParams();
  const search = params.search.trim();
  if (search) out.set("q", search);
  if (params.status !== SHOP_LIST_DEFAULTS.status) out.set("status", params.status);
  if (params.sort !== SHOP_LIST_DEFAULTS.sort) out.set("sort", params.sort);
  if (params.page > 1) out.set("page", String(params.page));
  const text = out.toString();
  return text ? `?${text}` : "";
}

/** params -> the backend's query, validated with the shared contract schema. */
export function toListShopsQuery(params: ShopListParams): ListShopsQuery {
  const status = STATUS_OPTIONS.find((o) => o.value === params.status) ?? STATUS_OPTIONS[0];
  const sort = SORT_OPTIONS.find((o) => o.value === params.sort) ?? SORT_OPTIONS[0];
  const search = params.search.trim();

  return listShopsQuerySchema.parse({
    page: params.page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    isActive: status.isActive,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  });
}

/** Keeps a page number inside 1..totalPages (e.g. after the last row of a page was deleted). */
export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(1, page), Math.max(1, totalPages));
}

/** True when any filter or search is active (used to tell "no shops yet" from "nothing matches"). */
export function hasActiveFilters(params: ShopListParams): boolean {
  return params.search.trim() !== "" || params.status !== SHOP_LIST_DEFAULTS.status;
}
