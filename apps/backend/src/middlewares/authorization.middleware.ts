import type { Request, Response, NextFunction } from "express";
import { SHOP_ROLE_PERMISSIONS, SHOP_PERMISSIONS } from "../config/permissions.js";

type ShopRole = keyof typeof SHOP_ROLE_PERMISSIONS;
type ShopPermission = (typeof SHOP_PERMISSIONS)[keyof typeof SHOP_PERMISSIONS];

export const authorize = (requiredPermission: ShopPermission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized: Authentication required",
      });
    }

    // 2. Ensure role exists and is a valid string
    if (typeof req.user.role !== "string" || !req.user.role.trim()) {
      return res.status(403).json({
        message: "Forbidden: No valid role assigned",
      });
    }

    // 3. Normalize & safely verify key exists on SHOP_ROLE_PERMISSIONS (prevents prototype lookup)
    const normalizedRole = req.user.role.trim().toUpperCase();
    if (!Object.hasOwn(SHOP_ROLE_PERMISSIONS, normalizedRole)) {
      return res.status(403).json({
        message: "Forbidden: Invalid role",
      });
    }

    const permissions = SHOP_ROLE_PERMISSIONS[normalizedRole as ShopRole] as readonly string[];

    // 4. Check permission (with optional wildcard support)
    const hasPermission =
      permissions.includes("*") || permissions.includes(requiredPermission);

    if (!hasPermission) {
      return res.status(403).json({
        message: "Forbidden: Insufficient permissions",
      });
    }

    return next();
  };
};