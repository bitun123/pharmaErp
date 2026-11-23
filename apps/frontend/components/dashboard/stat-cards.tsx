import { Ban, CheckCircle2, Sparkles, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_STATS, type DashboardStat } from "@/features/shops/mock-data";

const ICONS = { shops: Store, active: CheckCircle2, blocked: Ban, new: Sparkles } as const;

// Full class names so Tailwind can see them.
const TONES: Record<DashboardStat["tone"], string> = {
  team: "bg-team/15 text-team",
  attendance: "bg-attendance/15 text-attendance",
  danger: "bg-danger/15 text-danger",
  approval: "bg-approval/15 text-approval",
};

export function StatCards() {
  return (
    <section aria-label="Overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {DASHBOARD_STATS.map((stat) => {
        const Icon = ICONS[stat.icon];
        return (
          <div
            key={stat.key}
            className="rounded-xl bg-card p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_6px_20px_rgba(15,23,42,0.07)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.5),0_6px_20px_rgba(0,0,0,0.35)] transition-shadow hover:shadow-[0_2px_6px_rgba(15,23,42,0.08),0_10px_28px_rgba(15,23,42,0.1)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="truncate text-sm text-muted-foreground">{stat.label}</p>
              <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", TONES[stat.tone])}>
                <Icon className="size-4" />
              </div>
            </div>
            <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">{stat.value}</p>
          </div>
        );
      })}
    </section>
  );
}
