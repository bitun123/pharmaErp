import { RecentShops } from "@/components/dashboard/recent-shops";
import { StatCards } from "@/components/dashboard/stat-cards";
import { requirePermission } from "@/lib/dal";
import { SUPER_ADMIN_AREA_PERMISSION } from "@/lib/permissions";

export const metadata = { title: "Dashboard | Pharma ERP" };

export default async function DashboardPage() {
  await requirePermission(SUPER_ADMIN_AREA_PERMISSION);

  return (
    <div className="space-y-4 sm:space-y-6">
      <StatCards />
      <RecentShops />
    </div>
  );
}
