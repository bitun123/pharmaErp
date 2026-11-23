import { RecentShops } from "@/components/dashboard/recent-shops";
import { StatCards } from "@/components/dashboard/stat-cards";

export const metadata = { title: "Dashboard | Pharma ERP" };

export default function DashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <StatCards />
      <RecentShops />
    </div>
  );
}
