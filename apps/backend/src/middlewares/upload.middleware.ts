import multer, { MulterError } from "multer";
import path from "node:path";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../error/app-error.js";
import { detectImageType } from "../utils/image-signature.js";

/**
 * Supported MIME types and extensions for image uploads.
 * SVG is deliberately not allowed: it can carry scripts, and it cannot be
 * verified by magic bytes like the raster formats can.
 */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

// 5 MB max file size limit
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Multer storage in memory. Keeps file buffer in memory
 * ready for direct streaming to ImageKit.
 */
const storage = multer.memoryStorage();

/**
 * Strict file filter checking both MIME type and file extension.
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mime) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new AppError(
        "INVALID_FILE_TYPE",
        `Unsupported file type '${file.mimetype}'. Only JPEG, PNG, WEBP, and GIF images are allowed.`,
        400
      )
    );
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1, // Single image per default field
  },
  fileFilter,
});

/**
 * Middleware factory for single image upload with clean error translation.
 * Handles Multer-specific error codes (e.g. LIMIT_FILE_SIZE).
 */
export const singleImageUpload = (fieldName: string = "image") => {
  const uploadMiddleware = upload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, (err: any) => {
      if (!err) {
        // The client-sent MIME type and extension are only hints. Check the real bytes.
        if (req.file) {
          const detected = detectImageType(req.file.buffer);
          if (!detected) {
            return next(
              new AppError(
                "INVALID_FILE_CONTENT",
                "The uploaded file is not a valid JPEG, PNG, WEBP, or GIF image.",
                400
              )
            );
          }
          // Trust the bytes: store under the detected type and extension.
          req.file.mimetype = detected.mime;
          req.file.originalname = `${path.basename(req.file.originalname, path.extname(req.file.originalname))}${detected.ext}`;
        }
        return next();
      }

      if (err instanceof MulterError) {
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            return next(
              new AppError(
                "FILE_TOO_LARGE",
                `The uploaded image exceeds the 5MB file size limit.`,
                400
              )
            );
          case "LIMIT_UNEXPECTED_FILE":
            return next(
              new AppError(
                "UNEXPECTED_FIELD",
                `Unexpected field '${err.field}'. Expected field name '${fieldName}'.`,
                400
              )
            );
          default:
            return next(
              new AppError(
                "UPLOAD_ERROR",
                `File upload error: ${err.message}`,
                400
              )
            );
        }
      }

      return next(err);
    });
  };
};
