import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  Cross,
  Eye,
  Pill,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  RECENT_SHOPS,
  type RecentShop,
  type ShopIcon,
  type ShopStatus,
} from "@/features/shops/mock-data";

const ICONS: Record<ShopIcon, typeof Store> = {
  store: Store,
  pill: Pill,
  alert: AlertTriangle,
  cross: Cross,
  building: Building2,
};

function initials(name: string) {
  return name.replace(/^Dr\.\s*/, "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function StatusBadge({ status }: { status: ShopStatus }) {
  const active = status === "active";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        active
          ? "bg-[#E5F5F2] text-[#17B880] dark:bg-[#1A2F38] dark:text-[#37D298]"
          : "bg-[#FFE9EC] text-[#F43F5E] dark:bg-[#3A1C28] dark:text-[#FB7185]",
      )}
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-[#17B880] dark:bg-[#37D298]" : "bg-[#F43F5E] dark:bg-[#FB7185]")} />
      {active ? "Active" : "Blocked"}
    </span>
  );
}

function ShopName({ shop }: { shop: RecentShop }) {
  const Icon = ICONS[shop.icon];
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          shop.warning ? "bg-error-container text-on-error-container" : "bg-muted text-primary",
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold">{shop.name}</p>
        <p className={cn("truncate text-[11px]", shop.warning ? "text-destructive" : "text-muted-foreground")}>
          {shop.subtitle}
        </p>
      </div>
    </div>
  );
}

const AVATAR_COLORS = [
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-amber-500",
];

/** Same name -> same color, so avatars stay stable between renders. */
function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function AdminCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white", avatarColor(name))}>
        {initials(name)}
      </span>
      <span className="text-[13px]">{name}</span>
    </div>
  );
}

const viewBtn =
  "inline-flex h-8 items-center justify-center rounded-lg bg-muted px-3 text-[13px] font-medium transition-colors hover:bg-accent";

export function RecentShops() {
  return (
    <section className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_6px_20px_rgba(15,23,42,0.07)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.5),0_6px_20px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold sm:text-lg">Recently Created Shops</h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Latest {RECENT_SHOPS.length}
        </span>
      </div>

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
            {RECENT_SHOPS.map((shop) => (
              <tr key={shop.id} className="transition-colors hover:bg-muted/50">
                <td className="max-w-72 px-6 py-3.5"><ShopName shop={shop} /></td>
                <td className="px-4 py-3.5">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap">
                    {shop.code}
                  </code>
                </td>
                <td className="px-4 py-3.5"><AdminCell name={shop.adminName} /></td>
                <td className="hidden px-4 py-3.5 font-mono text-[11px] xl:table-cell">{shop.contact}</td>
                <td className="hidden px-4 py-3.5 font-mono text-[11px] lg:table-cell">{shop.createdAt}</td>
                <td className="px-4 py-3.5"><StatusBadge status={shop.status} /></td>
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
        {RECENT_SHOPS.map((shop) => (
          <li key={shop.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <ShopName shop={shop} />
              <StatusBadge status={shop.status} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Code</dt>
                <dd className="mt-0.5 font-mono text-[11px]">{shop.code}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Created</dt>
                <dd className="mt-0.5 font-mono text-[11px]">{shop.createdAt}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Admin</dt>
                <dd className="mt-0.5"><AdminCell name={shop.adminName} /></dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Contact</dt>
                <dd className="mt-0.5 font-mono text-[11px]">{shop.contact}</dd>
              </div>
            </dl>
            <Link href={`/shops/${shop.id}`} aria-label={`View ${shop.name}`} className={cn(viewBtn, "w-full gap-2")}>
              <Eye className="size-4" />
              View
            </Link>
          </li>
        ))}
      </ul>

    </section>
  );
}
