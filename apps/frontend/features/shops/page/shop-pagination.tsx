"use client";

import type { PaginationMeta } from "@repo/contracts";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getPageItems } from "@/lib/pagination";

type Props = {
  pagination: PaginationMeta;
  /** Real link for a page, so open-in-new-tab and copy-link work. */
  hrefForPage: (page: number) => string;
  onPageChange: (page: number) => void;
};

/** "Showing 11-20 of 45 shops" plus the shadcn pager. A single page shows only the count. */
export function ShopPagination({ pagination, hrefForPage, onPageChange }: Props) {
  const { total, page, limit, totalPages, hasPrevPage, hasNextPage } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Plain clicks change the page in-app. Modified clicks (new tab, etc.) keep the link's default.
  const go = (target: number) => (event: React.MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onPageChange(target);
  };
  const disabledProps = { "aria-disabled": true, tabIndex: -1, className: "pointer-events-none opacity-50" } as const;

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-muted-foreground">
        Showing {from}-{to} of {total} {total === 1 ? "shop" : "shops"}
      </p>

      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto justify-start sm:justify-end">
          <PaginationContent>
            <PaginationItem>
              {hasPrevPage ? (
                <PaginationPrevious href={hrefForPage(page - 1)} onClick={go(page - 1)} />
              ) : (
                <PaginationPrevious {...disabledProps} />
              )}
            </PaginationItem>

            {/* Phones: a short "Page 2 of 5" instead of the number buttons */}
            <PaginationItem className="px-2 text-xs text-muted-foreground sm:hidden">
              Page {page} of {totalPages}
            </PaginationItem>

            {getPageItems(page, totalPages).map((item) =>
              typeof item === "number" ? (
                <PaginationItem key={item} className="hidden sm:block">
                  <PaginationLink href={hrefForPage(item)} isActive={item === page} onClick={go(item)} aria-label={`Go to page ${item}`}>
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={item} className="hidden sm:block">
                  <PaginationEllipsis />
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              {hasNextPage ? (
                <PaginationNext href={hrefForPage(page + 1)} onClick={go(page + 1)} />
              ) : (
                <PaginationNext {...disabledProps} />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
