import express from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorization.middleware.js";
import { MEDIA_PERMISSIONS } from "../../config/permissions.js";
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
  authorize(MEDIA_PERMISSIONS.UPLOAD),
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
  authorize(MEDIA_PERMISSIONS.DELETE),
  deleteImageController
);

/**
 * GET /api/media/details/:fileId
 * Fetches metadata of an image from ImageKit.
 */
mediaRoutes.get(
  "/details/:fileId",
  authenticate,
  authorize(MEDIA_PERMISSIONS.READ),
  getImageDetailsController
);

/**
 * GET /api/media/auth
 * Generates client tokens for direct frontend uploads.
 */
mediaRoutes.get(
  "/auth",
  authenticate,
  authorize(MEDIA_PERMISSIONS.UPLOAD),
  getMediaAuthController
);

export default mediaRoutes;
