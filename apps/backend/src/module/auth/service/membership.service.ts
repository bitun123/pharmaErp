import type { AuthMembership } from "@repo/contracts/types/auth.types";
import { prisma } from "../config/database.js";
import { SHOP_ROLE_PERMISSIONS } from "../../../config/permissions.js";
import type { PlatformRole } from "../../../generated/prisma/enums.js";

// Creates the membership for a freshly created user. Role mirrors the platform
// role; permissions come from the role template. Safe to call twice (upsert).
export const createMembershipForUser = async (
  userId: string,
  role: PlatformRole,
): Promise<void> => {
  if(!SHOP_ROLE_PERMISSIONS[role] ){
     throw new Error(`Unknown role: ${role}`);
  }
  const permissions = Object.fromEntries(
    (SHOP_ROLE_PERMISSIONS[role] ?? []).map((permission) => [permission, true]),
  );

  
  await prisma.membership.upsert({
    where: { userId },
    update: {role,permissions},
    create: { userId, role, permissions },
  });
};

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
    title: membership.title,
    permissions: membership.permissions as AuthMembership["permissions"],
  };
};
