import { prisma } from "../auth/config/database.js";
import { AppError } from "../../error/app-error.js";

export type ShopAccessState = { isActive: boolean; deletedAt: Date | null };

/**
 * Turns a shop's state into the error that should stop its people from using the system.
 * Returns null when the shop is usable.
 */
export const getShopAccessError = (shop: ShopAccessState | null | undefined): AppError | null => {
  if (!shop) return null;
  if (shop.deletedAt) {
    return new AppError(
      "SHOP_DELETED",
      "This shop has been removed. Please contact your Super Administrator.",
      403,
    );
  }
  if (!shop.isActive) {
    return new AppError(
      "SHOP_BLOCKED",
      "This shop has been blocked. Please contact your Super Administrator.",
      403,
    );
  }
  return null;
};

/**
 * Used at sign-in. A Super Admin is never affected. Everyone else is checked against
 * the shop they belong to (membership) and the shop they administer (adminId), so a
 * blocked or deleted shop cannot even create a session.
 */
export const assertUserShopAccess = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      shop: { select: { isActive: true, deletedAt: true } },
      membership: {
        select: { role: true, shop: { select: { isActive: true, deletedAt: true } } },
      },
    },
  });

  if (!user || user.membership?.role === "SUPER_ADMIN") return;

  const error =
    getShopAccessError(user.membership?.shop) ?? getShopAccessError(user.shop);
  if (error) throw error;
};
