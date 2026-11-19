import express from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorization.middleware.js";
import { SHOP_PERMISSIONS } from "../../config/permissions.js";
import {
  createShopController,
  listShopsController,
  getShopByIdController,
  updateShopController,
  deleteShopController,
  setAdminPasswordController,
} from "./controller.js";

const routes = express.Router();

/**
 * POST /api/shop/set-admin-password
 * Public endpoint for an assigned shop administrator to set their password
 * using the secure cryptographic setup token sent to their email.
 */
routes.post("/set-admin-password", setAdminPasswordController);

/**
 * POST /api/shop
 * Creates a new shop and provisions its admin user.
 * Accessible ONLY by SUPERADMIN.
 */
routes.post(
  "/",
  authenticate,
  authorize(SHOP_PERMISSIONS.CREATE),
  createShopController
);

/**
 * GET /api/shop
 * Lists shops with pagination, filtering, searching, and sorting.
 * Accessible ONLY by SUPERADMIN.
 */
routes.get(
  "/",
  authenticate,
  authorize(SHOP_PERMISSIONS.READ),
  listShopsController
);

/**
 * GET /api/shop/:id
 * Fetches details of a single shop by ID or Slug.
 * Accessible ONLY by SUPERADMIN.
 */
routes.get(
  "/:id",
  authenticate,
  authorize(SHOP_PERMISSIONS.READ),
  getShopByIdController
);

/**
 * PATCH /api/shop/:id
 * Updates an existing shop.
 * Accessible ONLY by SUPERADMIN.
 */
routes.patch(
  "/:id",
  authenticate,
  authorize(SHOP_PERMISSIONS.UPDATE),
  updateShopController
);

/**
 * DELETE /api/shop/:id
 * Deletes a shop.
 * Accessible ONLY by SUPERADMIN.
 */
routes.delete(
  "/:id",
  authenticate,
  authorize(SHOP_PERMISSIONS.DELETE),
  deleteShopController
);

export default routes;
