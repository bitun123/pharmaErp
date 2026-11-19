import type { Request, Response, NextFunction } from "express";
import {
  uploadImage,
  deleteImage,
  getImageDetails,
  getClientAuthParameters,
} from "../../services/imagekit.service.js";
import { AppError } from "../../error/app-error.js";

/**
 * Controller to upload an image to ImageKit.
 */
export const uploadImageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;

    if (!file) {
      throw new AppError(
        "NO_FILE_PROVIDED",
        "Please select an image file to upload under the 'image' field.",
        400
      );
    }

    const folder = typeof req.body.folder === "string" ? req.body.folder : undefined;
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : typeof req.body.tags === "string"
      ? req.body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const result = await uploadImage({
      file: file.buffer,
      fileName: file.originalname,
      folder,
      tags,
    });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete an image by fileId from ImageKit.
 */
export const deleteImageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = req.params;

    if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
      throw new AppError(
        "INVALID_FILE_ID",
        "A valid file ID parameter is required.",
        400
      );
    }

    const result = await deleteImage(fileId);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get metadata for an image from ImageKit.
 */
export const getImageDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = req.params;

    if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
      throw new AppError(
        "INVALID_FILE_ID",
        "A valid file ID parameter is required.",
        400
      );
    }

    const details = await getImageDetails(fileId);

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to generate client-side authentication parameters
 * for direct frontend uploads to ImageKit.
 */
export const getMediaAuthController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authParams = getClientAuthParameters();

    res.status(200).json({
      success: true,
      data: authParams,
    });
  } catch (error) {
    next(error);
  }
};
