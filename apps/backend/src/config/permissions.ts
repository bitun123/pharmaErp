export const SHOP_PERMISSIONS = {
  CREATE: "shop:create",
  READ: "shop:read",
  UPDATE: "shop:update",
  DELETE: "shop:delete",
} as const;

export const SHOP_ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    SHOP_PERMISSIONS.CREATE,
    SHOP_PERMISSIONS.READ,
    SHOP_PERMISSIONS.UPDATE,
    SHOP_PERMISSIONS.DELETE,
  ],

    ADMIN: [
    SHOP_PERMISSIONS.READ,
  ],

  STAFF: [],
} as const;