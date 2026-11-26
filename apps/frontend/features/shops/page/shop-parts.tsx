import { cn } from "@/lib/utils";

/** Small pieces shared by every shop table (dashboard and the /shops page). */

export type ShopStatus = "active" | "blocked";

export function initials(name: string) {
  const letters = name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return letters || "?";
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

export function StatusBadge({ status }: { status: ShopStatus }) {
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

export function AdminCell({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white", avatarColor(name))}>
        {initials(name)}
      </span>
      <span className="truncate text-[13px]">{name}</span>
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

/** 2026-05-14T09:30:00Z -> 14/05/2026. A missing or invalid date shows a dash instead of "Invalid Date". */
export function formatShopDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}
