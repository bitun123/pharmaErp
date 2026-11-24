import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../module/auth/config/auth.js";
import { prisma } from "../module/auth/config/database.js";
import { resolveEffectivePermissions, type PermissionMap } from "../module/auth/service/membership.service.js";
import { AppError } from "../error/app-error.js";
import { isRoleKey } from "../config/permissions.js";
import { getShopAccessError } from "../module/shop/shop-access.service.js";
import type { PlatformRole } from "../generated/prisma/enums.js";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        sessionId: string;
        name: string | null;
        role: PlatformRole;
        membershipId: string | null;
        shopId: string | null;
        permissions: PermissionMap;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new AppError("UNAUTHORIZED", "Authentication required.", 401);
    }

    const rawRole = String(
      (session.user as Record<string, unknown>).role ?? "STAFF",
    )
      .trim()
      .toUpperCase();
    // Unknown roles fall back to the least-privileged one.
    const role: PlatformRole = isRoleKey(rawRole) ? rawRole : "STAFF";

    const membership = await prisma.membership.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        shopId: true,
        permissions: true,
        shop: { select: { isActive: true, deletedAt: true } },
      },
    });

    // A blocked or deleted shop locks out its admin and staff immediately,
    // even if they still hold a valid session. Super admins are never tied to a shop.
    if (role !== "SUPER_ADMIN") {
      const shopError = getShopAccessError(membership?.shop);
      if (shopError) throw shopError;
    }

    req.user = {
      id: session.user.id,
      sessionId: session.session.id,
      name: session.user.name,
      role,
      membershipId: membership?.id ?? null,
      shopId: membership?.shopId ?? null,
      permissions: resolveEffectivePermissions(role, membership?.permissions),
    };

    next();
  } catch (error) {
    next(error);
  }
};
