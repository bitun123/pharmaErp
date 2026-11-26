
import { StatCards } from "@/components/dashboard/stat-cards";
import { ShopListPage } from "@/features/shops/page/shop-list-page";
import { requirePermission } from "@/lib/dal";
import { SHOP_CREATE_PERMISSION, SUPER_ADMIN_AREA_PERMISSION, hasPermission } from "@/lib/permissions";

export const metadata = { title: "Dashboard | Pharma ERP" };

export default async function DashboardPage() {
  const session = await requirePermission(SUPER_ADMIN_AREA_PERMISSION);
  const canCreate = hasPermission(session.membership?.permissions ?? {}, SHOP_CREATE_PERMISSION);

  return (
    <div className="space-y-4 sm:space-y-6">
      <StatCards />
      <ShopListPage canCreate={canCreate} />
    </div>
  );
}
