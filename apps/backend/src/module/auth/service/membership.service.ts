import { AppError } from "../../../error/app-error.js";
import type { AuthMembership } from "@repo/contracts/types/auth.types";
import { prisma } from "../config/database.js";
import {
  SHOP_ROLE_PERMISSIONS,
  buildPermissions,
  isRoleKey,
  isValidPermission,
} from "../../../config/permissions.js";
import type { PlatformRole } from "../../../generated/prisma/enums.js";
import { logger } from "../../../config/logger.js";

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
 * A SUPER_ADMIN always gets at least the full role template on top of whatever is
 * stored. That keeps a stale row from locking out the platform, and means newly
 * added permissions (e.g. media:*) reach existing super admins without a backfill.
 */
export const resolveEffectivePermissions = (
  role: string | null | undefined,
  rawPermissions: unknown,
): PermissionMap => {
  const stored = normalizePermissions(rawPermissions);
  if (role === "SUPER_ADMIN") {
    return { ...stored, ...buildPermissions("SUPER_ADMIN") };
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
  db: Pick<typeof prisma, "membership"> = prisma,
): Promise<void> => {
  try {
    if (!isRoleKey(role)) {
      throw new Error(`Unknown role: ${role}`);
    }

    const existing = await db.membership.findUnique({
      where: { userId },
      select: { role: true },
    });
    const shopPart = shopId === undefined ? {} : { shopId };

    if (!existing) {
      await db.membership.create({
        data: { userId, role, permissions: buildPermissions(role), ...shopPart },
      });
      return;
    }

    await db.membership.update({
      where: { userId },
      data: {
        role,
        ...(existing.role !== role ? { permissions: buildPermissions(role) } : {}),
        ...shopPart,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, "createMembershipForUser failed");
    throw new AppError(
      "MEMBERSHIP_SAVE_FAILED",
      "Failed to save the membership.",
      500
    );
  }
};

/** Alias that reads better where an existing user's role is being changed. */
export const syncMembershipRole = createMembershipForUser;

export const getMembershipForUser = async (
  userId: string,
): Promise<AuthMembership | null> => {
  try {
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
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, "getMembershipForUser failed");
    throw new AppError(
      "MEMBERSHIP_FETCH_FAILED",
      "Failed to fetch the membership.",
      500
    );
  }
};

// Re-exported so callers have one import for role templates.
export { SHOP_ROLE_PERMISSIONS };
