import type { Request, Response, NextFunction } from "express";
import {
  createShopSchema,
  updateShopSchema,
  listShopsQuerySchema,
  setAdminPasswordSchema,
} from "@repo/contracts";
import {
  createShopService,
  listShopsService,
  getShopByIdService,
  updateShopService,
  deleteShopService,
  setAdminPasswordService,
} from "./service.js";

/**
 * Controller to create a new Shop and its Admin.
 * Accessible only by SUPERADMIN.
 */
export const createShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createShopSchema.parse(req.body);
    const shop = await createShopService(validatedData);

    res.status(201).json({
      success: true,
      message: "Shop and Administrator account created successfully.",
      data: shop,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for an admin setting their password via the invitation link.
 * Public endpoint (secured by the cryptographic verification token).
 */
export const setAdminPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = setAdminPasswordSchema.parse(req.body);
    const result = await setAdminPasswordService(validatedData);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to list all shops with pagination, filtering, searching, and sorting.
 * Accessible only by SUPERADMIN.
 */
export const listShopsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = listShopsQuerySchema.parse(req.query);
    const result = await listShopsService(validatedQuery);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch detailed information of a single shop by ID or Slug.
 * Accessible only by SUPERADMIN.
 */
export const getShopByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const shop = await getShopByIdService(id);

    res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update shop information.
 * Accessible only by SUPERADMIN.
 */
export const updateShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const validatedData = updateShopSchema.parse(req.body);

    const updatedShop = await updateShopService(id, validatedData);

    res.status(200).json({
      success: true,
      message: "Shop updated successfully.",
      data: updatedShop,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete a shop.
 * Accessible only by SUPERADMIN.
 */
export const deleteShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteShopService(id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { id: result.id },
    });
  } catch (error) {
    next(error);
  }
};
