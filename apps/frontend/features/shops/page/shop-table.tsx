import Link from "next/link";
import { Ban, Eye, Store } from "lucide-react";
import type { Shop } from "@repo/contracts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AdminCell, StatusBadge, formatShopDate } from "./shop-parts";

const EMPTY = "—";

function ShopName({ shop }: { shop: Shop }) {
  const Icon = shop.isActive ? Store : Ban;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          shop.isActive ? "bg-muted text-primary" : "bg-error-container text-on-error-container",
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold" title={shop.name}>{shop.name}</p>
        <p className="truncate text-[11px] text-muted-foreground" title={shop.address ?? undefined}>
          {shop.address || "No address added"}
        </p>
      </div>
    </div>
  );
}

function AdminName({ shop }: { shop: Shop }) {
  const name = shop.admin?.name?.trim();
  return name ? <AdminCell name={name} /> : <span className="text-[13px] text-muted-foreground">{EMPTY}</span>;
}

const statusOf = (shop: Shop) => (shop.isActive ? "active" : "blocked");

/** One page of shops: a table from `md` up, cards on phones. `busy` dims it while the next page loads. */
export function ShopTable({ shops, busy }: { shops: Shop[]; busy: boolean }) {
  return (
    <div aria-busy={busy} className={cn("transition-opacity", busy && "opacity-60")}>
      {/* Tablet / desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-3xl text-left text-[13px]">
          <thead className="border-y border-border/60 text-[13px] font-medium text-muted-foreground dark:bg-muted/60 dark:text-[11px] dark:tracking-wider dark:uppercase">
            <tr>
              <th className="px-6 py-3.5 font-medium dark:font-semibold">Shop Name</th>
              <th className="px-4 py-3.5 font-medium dark:font-semibold">Shop Code</th>
              <th className="px-4 py-3.5 font-medium dark:font-semibold">Shop Admin</th>
              <th className="hidden px-4 py-3.5 font-medium dark:font-semibold xl:table-cell">Contact Number</th>
              <th className="hidden px-4 py-3.5 font-medium dark:font-semibold lg:table-cell">Created Date</th>
              <th className="px-4 py-3.5 font-medium dark:font-semibold">Status</th>
              <th className="px-6 py-3.5 text-right font-medium dark:font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-transparent dark:divide-border">
            {shops.map((shop) => (
              <tr key={shop.id} className="transition-colors hover:bg-muted/50">
                <td className="max-w-72 px-6 py-3.5"><ShopName shop={shop} /></td>
                <td className="px-4 py-3.5">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap">{shop.shopCode}</code>
                </td>
                <td className="max-w-52 px-4 py-3.5"><AdminName shop={shop} /></td>
                <td className="hidden px-4 py-3.5 font-mono text-[11px] xl:table-cell">{shop.admin?.phoneNumber || EMPTY}</td>
                <td className="hidden px-4 py-3.5 font-mono text-[11px] lg:table-cell">{formatShopDate(shop.createdAt)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={statusOf(shop)} /></td>
                <td className="px-6 py-3.5 text-right">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Link
                          href={`/shops/${shop.id}`}
                          aria-label={`View ${shop.name}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                      }
                    >
                      <Eye className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent>View details</TooltipContent>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <ul className="divide-y divide-border border-t border-border md:hidden">
        {shops.map((shop) => (
          <li key={shop.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <ShopName shop={shop} />
              <StatusBadge status={statusOf(shop)} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Code</dt>
                <dd className="mt-0.5 font-mono text-[11px]">{shop.shopCode}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Created</dt>
                <dd className="mt-0.5 font-mono text-[11px]">{formatShopDate(shop.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Admin</dt>
                <dd className="mt-0.5"><AdminName shop={shop} /></dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Contact</dt>
                <dd className="mt-0.5 font-mono text-[11px]">{shop.admin?.phoneNumber || EMPTY}</dd>
              </div>
            </dl>
            <Link
              href={`/shops/${shop.id}`}
              aria-label={`View ${shop.name}`}
              className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-muted px-3 text-[13px] font-medium transition-colors hover:bg-accent"
            >
              <Eye className="size-4" />
              View
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
