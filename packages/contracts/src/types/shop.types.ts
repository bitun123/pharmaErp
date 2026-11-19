import type { z } from "zod";
import type {
  createShopSchema,
  updateShopSchema,
  listShopsQuerySchema,
  setAdminPasswordSchema,
} from "../zod/shop.zod.js";

/**
 * Type inferred from `createShopSchema`.
 */
export type CreateShopInput = z.infer<typeof createShopSchema>;

/**
 * Type inferred from `updateShopSchema`.
 */
export type UpdateShopInput = z.infer<typeof updateShopSchema>;

/**
 * Type inferred from `listShopsQuerySchema`.
 */
export type ListShopsQuery = z.infer<typeof listShopsQuerySchema>;

/**
 * Type inferred from `setAdminPasswordSchema`.
 */
export type SetAdminPasswordInput = z.infer<typeof setAdminPasswordSchema>;

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
  admin?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    phoneNumber?: string | null;
    image?: string | null;
  };
}

/**
 * Standard Shop API response envelopes.
 */
export interface ShopResponse {
  success: boolean;
  message?: string;
  data: Shop;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedShopResponse {
  success: boolean;
  data: Shop[];
  pagination: PaginationMeta;
}

export interface ShopListResponse {
  success: boolean;
  data: Shop[];
  total?: number;
}
