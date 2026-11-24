/** Permission map returned by the backend session ({ "shop:read": true, "*": true, ... }). */
export type PermissionMap = Record<string, boolean | "all">;

/**
 * True when the map grants `required`, directly or through the "*" wildcard.
 * Mirrors the backend rule (membership.service.ts hasPermission). Use it to show or
 * hide UI only: the backend checks every request again, so this is never the security.
 */
export const hasPermission = (permissions: PermissionMap, required: string): boolean =>
  permissions["*"] === true || permissions[required] === true;

/** The permission that opens the Super Admin area. */
export const SUPER_ADMIN_AREA_PERMISSION = "shop:read";
