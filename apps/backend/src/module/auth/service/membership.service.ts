import type { AuthMembership } from "@repo/contracts/types/auth.types";
import { prisma } from "../config/database.js";
import {
  SHOP_ROLE_PERMISSIONS,
  buildPermissions,
  isRoleKey,
  isValidPermission,
} from "../../../config/permissions.js";
import type { PlatformRole } from "../../../generated/prisma/enums.js";

export type PermissionMap = Record<string, boolean | "all">;

/**
 * Turns whatever is stored in Membership.permissions into a safe map.
 * Drops unknown keys, non-boolean values and malformed JSON (null, arrays,
 * strings), so garbage can never grant access. "all" is the only wildcard.
 */
export const normalizePermissions = (raw: unknown): PermissionMap => {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return {};

  const result: PermissionMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key === "all" || key === "*") {
      if (value === true || value === "all") result["*"] = true;
      continue;
    }
    if (isValidPermission(key) && typeof value === "boolean") {
      result[key] = value;
    }
  }
  return result;
};

/** True when the map grants `required`, directly or through the wildcard. */
export const hasPermission = (
  permissions: PermissionMap,
  required: string,
): boolean => permissions["*"] === true || permissions[required] === true;

/**
 * Effective permissions for a user. The membership is the source of truth.
 * Safety net: a SUPER_ADMIN whose stored permissions are empty falls back to
 * the role template, so a stale row can never lock out the whole platform.
 */
export const resolveEffectivePermissions = (
  role: string | null | undefined,
  rawPermissions: unknown,
): PermissionMap => {
  const stored = normalizePermissions(rawPermissions);
  if (Object.keys(stored).length === 0 && role === "SUPER_ADMIN") {
    return buildPermissions("SUPER_ADMIN");
  }
  return stored;
};

/**
 * Creates the membership for a user, or syncs it when it already exists.
 * - new row: permissions seeded from the role template
 * - role changed: permissions re-seeded from the new role's template
 * - role unchanged: existing (possibly customised) permissions are kept
 * `shopId` is only touched when passed (use null to detach).
 */
export const createMembershipForUser = async (
  userId: string,
  role: PlatformRole,
  shopId?: string | null,
): Promise<void> => {
  if (!isRoleKey(role)) {
    throw new Error(`Unknown role: ${role}`);
  }

  const existing = await prisma.membership.findUnique({
    where: { userId },
    select: { role: true },
  });
  const shopPart = shopId === undefined ? {} : { shopId };

  if (!existing) {
    await prisma.membership.create({
      data: { userId, role, permissions: buildPermissions(role), ...shopPart },
    });
    return;
  }

  await prisma.membership.update({
    where: { userId },
    data: {
      role,
      ...(existing.role !== role ? { permissions: buildPermissions(role) } : {}),
      ...shopPart,
    },
  });
};

/** Alias that reads better where an existing user's role is being changed. */
export const syncMembershipRole = createMembershipForUser;

export const getMembershipForUser = async (
  userId: string,
): Promise<AuthMembership | null> => {
  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (!membership) return null;

  return {
    id: membership.id,
    role: membership.role,
    shopId: membership.shopId,
    title: membership.title,
    permissions: resolveEffectivePermissions(
      membership.role,
      membership.permissions,
    ),
  };
};

// Re-exported so callers have one import for role templates.
export { SHOP_ROLE_PERMISSIONS };
