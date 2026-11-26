import { Suspense } from "react";
import { ShopRowsSkeleton } from "@/features/shops/page/shop-list-skeleton";
import { ShopListPage } from "@/features/shops/page/shop-list-page";
import { requirePermission } from "@/lib/dal";
import { SHOP_CREATE_PERMISSION, SUPER_ADMIN_AREA_PERMISSION, hasPermission } from "@/lib/permissions";

export const metadata = { title: "Shop Management | Pharma ERP" };

export default async function ShopsPage() {
  // Same server-side check as the dashboard: layouts do not re-run on navigation.
  const session = await requirePermission(SUPER_ADMIN_AREA_PERMISSION);
  const canCreate = hasPermission(session.membership?.permissions ?? {}, SHOP_CREATE_PERMISSION);

  // useSearchParams (inside ShopListPage) must sit under a Suspense boundary.
  return (
    <Suspense
      fallback={
        <section className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_6px_20px_rgba(15,23,42,0.07)]">
          <ShopRowsSkeleton />
        </section>
      }
    >
      <ShopListPage canCreate={canCreate} />
    </Suspense>
  );
}
