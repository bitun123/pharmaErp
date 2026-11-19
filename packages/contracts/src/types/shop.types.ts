import type { z } from "zod";
import type { createShopSchema, updateShopSchema } from "../zod/shop.zod";

/**
 * Type inferred from `createShopSchema`.
 */
export type CreateShopInput = z.infer<typeof createShopSchema>;

/**
 * Type inferred from `updateShopSchema`.
 */
export type UpdateShopInput = z.infer<typeof updateShopSchema>;

/**
 * Complete Shop representation matching Prisma database entity.
 */
export interface Shop {
  id: string;
  shopCode: string;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  adminId: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Standard Shop API response envelopes.
 */
export interface ShopResponse {
  success: boolean;
  message?: string;
  data: Shop;
}

export interface ShopListResponse {
  success: boolean;
  data: Shop[];
  total?: number;
}
