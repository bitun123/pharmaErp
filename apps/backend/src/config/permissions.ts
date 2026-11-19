export const SHOP_PERMISSIONS = {
  CREATE: "shop:create",
  READ: "shop:read",
  UPDATE: "shop:update",
  DELETE: "shop:delete",
} as const;

export type Permission = (typeof SHOP_PERMISSIONS)[keyof typeof SHOP_PERMISSIONS];

export const ALL_PERMISSIONS: readonly Permission[] = Object.values(SHOP_PERMISSIONS);

// Default permission template per role. It only seeds Membership.permissions;
// authorization reads the membership (see authenticate + authorize middlewares).
export const SHOP_ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    SHOP_PERMISSIONS.CREATE,
    SHOP_PERMISSIONS.READ,
    SHOP_PERMISSIONS.UPDATE,
    SHOP_PERMISSIONS.DELETE,
  ],

  ADMIN: [],

  STAFF: [],
} as const;

export type RoleKey = keyof typeof SHOP_ROLE_PERMISSIONS;

export const isValidPermission = (value: string): value is Permission =>
  (ALL_PERMISSIONS as readonly string[]).includes(value);

export const isRoleKey = (value: unknown): value is RoleKey =>
  typeof value === "string" && Object.hasOwn(SHOP_ROLE_PERMISSIONS, value);

/** Permission map ({ "shop:read": true, ... }) for a role's default template. */
export const buildPermissions = (role: RoleKey): Record<string, true> =>
  Object.fromEntries(
    (SHOP_ROLE_PERMISSIONS[role] as readonly string[]).map((p) => [p, true]),
  );
