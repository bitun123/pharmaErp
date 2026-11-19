import crypto from "node:crypto";
import path from "node:path";
import { getImageKit, getImageKitConfig } from "../config/imagekit.js";
import { AppError } from "../error/app-error.js";

export interface UploadImageInput {
  /**
   * File data as Buffer, base64 data URI string, or external image URL.
   */
  file: Buffer | string;
  /**
   * Original file name (e.g. "shop-logo.png").
   */
  fileName: string;
  /**
   * Destination folder path in ImageKit (e.g. "/shops/logos").
   * Defaults to "/general".
   */
  folder?: string;
  /**
   * Optional searchable tags for the image.
   */
  tags?: string[];
  /**
   * Whether the file should be marked private (requires signed URLs to access).
   */
  isPrivateFile?: boolean;
}

export interface UploadImageResult {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  filePath: string;
  size: number;
  fileType: string;
  height?: number;
  width?: number;
}

export interface GenerateImageUrlInput {
  path?: string;
  src?: string;
  transformation?: Array<{
    height?: number | string;
    width?: number | string;
    quality?: number | string;
    format?: "auto" | "webp" | "jpg" | "png";
    crop?: "maintain_ratio" | "force" | "at_least" | "at_max";
    cropMode?: "resize" | "extract" | "pad_resize" | "pad_extract";
    blur?: number;
    [key: string]: unknown;
  }>;
  transformationPosition?: "path" | "query";
  signed?: boolean;
  expireSeconds?: number;
}

/**
 * Sanitizes folder string to prevent path traversal and ensure proper format.
 * Example: "shops/logos/../" -> "/shops/logos"
 */
export const sanitizeFolder = (folder?: string): string => {
  if (!folder || typeof folder !== "string") {
    return "/general";
  }

  const cleaned = folder
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/")
    .replace(/\.\./g, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  return cleaned ? `/${cleaned}` : "/general";
};

/**
 * Sanitizes file names to remove malicious characters, directory traversal,
 * and ensures safe storage with a unique suffix while preserving extension.
 */
export const sanitizeFileName = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase() || ".png";
  const baseName = path.basename(originalName, ext);

  // Replace non-alphanumeric characters with hyphens
  const cleanBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const safeBase = cleanBase || "image";
  const uniqueSuffix = crypto.randomBytes(6).toString("hex");

  return `${safeBase}-${uniqueSuffix}${ext}`;
};

/**
 * Validates that ImageKit configuration is present before attempting operations.
 */
const ensureImageKitConfigured = () => {
  const { publicKey, privateKey, urlEndpoint } = getImageKitConfig();
  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new AppError(
      "IMAGEKIT_NOT_CONFIGURED",
      "ImageKit credentials are not properly configured on this server.",
      500
    );
  }
};

/**
 * Uploads an image to ImageKit.
 * Supports Buffers (from multer), base64 data URIs, or external URLs.
 */
export const uploadImage = async (
  input: UploadImageInput
): Promise<UploadImageResult> => {
  ensureImageKitConfigured();

  const { file, fileName, folder = "/general", tags = [], isPrivateFile = false } = input;

  if (!file) {
    throw new AppError("INVALID_FILE", "File content is required for upload.", 400);
  }

  if (Buffer.isBuffer(file) && file.length === 0) {
    throw new AppError("EMPTY_FILE", "Uploaded file buffer is empty (0 bytes).", 400);
  }

  const sanitizedFolder = sanitizeFolder(folder);
  const safeFileName = sanitizeFileName(fileName || "upload.png");

  const imagekit = getImageKit();

  try {
    const response = await imagekit.upload({
      file,
      fileName: safeFileName,
      folder: sanitizedFolder,
      tags,
      isPrivateFile,
      useUniqueFileName: false, // We already guarantee unique safe names
    });

    return {
      fileId: response.fileId,
      name: response.name,
      url: response.url,
      thumbnailUrl: response.thumbnailUrl,
      filePath: response.filePath,
      size: response.size,
      fileType: response.fileType,
      height: response.height,
      width: response.width,
    };
  } catch (error: any) {
    console.error("[ImageKit Upload Error]:", error);
    const message = error?.message || "Failed to upload image to ImageKit.";
    throw new AppError("IMAGEKIT_UPLOAD_ERROR", message, error?.status || 502);
  }
};

/**
 * Deletes a file from ImageKit by its unique fileId.
 */
export const deleteImage = async (fileId: string): Promise<{ success: boolean; fileId: string }> => {
  ensureImageKitConfigured();

  if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
    throw new AppError("INVALID_FILE_ID", "A valid ImageKit file ID is required for deletion.", 400);
  }

  const cleanFileId = fileId.trim();
  const imagekit = getImageKit();

  try {
    await imagekit.deleteFile(cleanFileId);
    return { success: true, fileId: cleanFileId };
  } catch (error: any) {
    // Check if error represents a 404 (file already gone or does not exist)
    if (error?.status === 404 || error?.message?.toLowerCase().includes("not found")) {
      throw new AppError(
        "FILE_NOT_FOUND",
        `Image with ID '${cleanFileId}' not found or already deleted.`,
        404
      );
    }

    console.error("[ImageKit Delete Error]:", error);
    const message = error?.message || "Failed to delete image from ImageKit.";
    throw new AppError("IMAGEKIT_DELETE_ERROR", message, error?.status || 502);
  }
};

/**
 * Retrieves metadata for an image from ImageKit by fileId.
 */
export const getImageDetails = async (fileId: string) => {
  ensureImageKitConfigured();

  if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
    throw new AppError("INVALID_FILE_ID", "A valid ImageKit file ID is required.", 400);
  }

  const cleanFileId = fileId.trim();
  const imagekit = getImageKit();

  try {
    const details = await imagekit.getFileDetails(cleanFileId);
    return details;
  } catch (error: any) {
    if (error?.status === 404 || error?.message?.toLowerCase().includes("not found")) {
      throw new AppError("FILE_NOT_FOUND", `File with ID '${cleanFileId}' was not found.`, 404);
    }
    console.error("[ImageKit GetDetails Error]:", error);
    throw new AppError(
      "IMAGEKIT_DETAILS_ERROR",
      error?.message || "Failed to retrieve file details.",
      error?.status || 502
    );
  }
};

/**
 * Generates an optimized, transformed, or signed download/view URL.
 */
export const generateImageUrl = (options: GenerateImageUrlInput): string => {
  ensureImageKitConfigured();

  if (!options.path && !options.src) {
    throw new AppError("INVALID_URL_OPTIONS", "Either path or src must be provided.", 400);
  }

  const imagekit = getImageKit();
  const baseOptions = {
    transformation: options.transformation as any,
    transformationPosition: options.transformationPosition || "path",
    signed: options.signed,
    expireSeconds: options.expireSeconds,
  };

  if (options.path) {
    return imagekit.url({
      ...baseOptions,
      path: options.path,
    });
  }

  return imagekit.url({
    ...baseOptions,
    src: options.src as string,
  });
};

/**
 * Generates client-side authentication parameters for direct frontend uploads.
 * This keeps the privateKey secure on the backend while allowing large file direct uploads.
 */
export const getClientAuthParameters = (token?: string, expire?: number) => {
  ensureImageKitConfigured();

  const imagekit = getImageKit();
  return imagekit.getAuthenticationParameters(token, expire);
};
