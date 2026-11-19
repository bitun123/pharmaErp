import express from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { singleImageUpload } from "../../middlewares/upload.middleware.js";
import {
  uploadImageController,
  deleteImageController,
  getImageDetailsController,
  getMediaAuthController,
} from "./controller.js";

const mediaRoutes = express.Router();

/**
 * POST /api/media/upload
 * Accepts multipart/form-data with an "image" field and optional "folder" and "tags".
 */
mediaRoutes.post(
  "/upload",
  authenticate,
  singleImageUpload("image"),
  uploadImageController
);

/**
 * DELETE /api/media/:fileId
 * Deletes an image from ImageKit by fileId.
 */
mediaRoutes.delete(
  "/:fileId",
  authenticate,
  deleteImageController
);

/**
 * GET /api/media/details/:fileId
 * Fetches metadata of an image from ImageKit.
 */
mediaRoutes.get(
  "/details/:fileId",
  authenticate,
  getImageDetailsController
);

/**
 * GET /api/media/auth
 * Generates client tokens for direct frontend uploads.
 */
mediaRoutes.get(
  "/auth",
  authenticate,
  getMediaAuthController
);

export default mediaRoutes;
