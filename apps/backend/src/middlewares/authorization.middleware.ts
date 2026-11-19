import type { Request, Response, NextFunction } from "express";
import type { Permission } from "../config/permissions.js";
import { hasPermission } from "../module/auth/service/membership.service.js";
import { AppError } from "../error/app-error.js";

/**
 * Requires `requiredPermission` on the user's membership (loaded by `authenticate`).
 * Must run after `authenticate`.
 */
export const authorize = (requiredPermission: Permission) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("UNAUTHORIZED", "Authentication required.", 401));
    }

    if (!req.user.membershipId && req.user.role !== "SUPER_ADMIN") {
      return next(
        new AppError("NO_MEMBERSHIP", "No membership found for this account.", 403),
      );
    }

    if (!hasPermission(req.user.permissions, requiredPermission)) {
      return next(
        new AppError("FORBIDDEN", "Insufficient permissions.", 403),
      );
    }

    next();
  };
};
