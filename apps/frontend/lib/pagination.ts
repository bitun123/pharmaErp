export type PageItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * The page numbers to show in a pager: always the first and last page, the current page with
 * one neighbour each side, and "..." where pages are skipped. Few pages are all shown.
 * Example (page 5 of 20): 1 ... 4 5 6 ... 20
 */
export function getPageItems(current: number, total: number): PageItem[] {
  const last = Math.max(1, Math.floor(total));
  const page = Math.min(Math.max(1, Math.floor(current)), last);

  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(last - 1, page + 1);

  if (start > 2) items.push("ellipsis-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < last - 1) items.push("ellipsis-end");

  items.push(last);
  return items;
}
