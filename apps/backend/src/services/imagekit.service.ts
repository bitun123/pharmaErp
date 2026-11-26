import crypto from "node:crypto";
import path from "node:path";
import { getImageKit, getImageKitConfig } from "../config/imagekit.js";
import { AppError } from "../error/app-error.js";
import { logger } from "../config/logger.js";

/**
 * The only ImageKit folders this API will write to, read from or delete in.
 * Anything else in the ImageKit account (other apps' assets) stays untouchable.
 */
export const MANAGED_FOLDERS = ["/shops/logos", "/users/avatars", "/general"] as const;

/** Uploaded but not yet attached to a record. A cleanup script removes stale ones. */
export const PENDING_TAG = "pending";

const FILE_ID_REGEX = /^[A-Za-z0-9]{8,64}$/;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 40;

/** Longest we wait for any single ImageKit call before answering the client. */
const IMAGEKIT_TIMEOUT_MS = 30_000;

class ImageKitTimeoutError extends Error {
  constructor() {
    super(`ImageKit did not respond within ${IMAGEKIT_TIMEOUT_MS / 1000}s`);
    this.name = "ImageKitTimeoutError";
  }
}

/**
 * Runs one ImageKit SDK call with a timeout. The SDK (axios) has no timeout option,
 * so a stalled call would otherwise hang the request. A timed-out upload may still
 * finish on ImageKit's side; it keeps the "pending" tag, so the cleanup script removes it.
 */
const runImageKit = <T>(call: () => Promise<T>): Promise<T> => {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ImageKitTimeoutError()), IMAGEKIT_TIMEOUT_MS);
  });
  return Promise.race([call(), timeout]).finally(() => clearTimeout(timer));
};

/**
 * The SDK hides the HTTP status in a non-enumerable `$ResponseMetadata`, so `error.status`
 * is always undefined. Read it from there.
 */
const getUpstreamStatus = (error: any): number | undefined =>
  error?.$ResponseMetadata?.statusCode ?? error?.status ?? error?.response?.status;

const isNotFound = (error: any): boolean =>
  getUpstreamStatus(error) === 404 || /not found/i.test(String(error?.message ?? ""));

/** Logs everything useful about an ImageKit failure (no headers, no keys). */
const logImageKitError = (error: any, operation: string): void => {
  logger.error(
    {
      operation,
      upstreamStatus: getUpstreamStatus(error),
      timedOut: error instanceof ImageKitTimeoutError,
      errorCode: error?.code,
      errorMessage: error?.message,
      help: error?.help,
    },
    `ImageKit ${operation} failed`
  );
};

/** Logs the failure and builds the API error returned to the client. */
const toImageKitError = (error: any, operation: string, code: string, clientMessage: string): AppError => {
  logImageKitError(error, operation);
  const timedOut = error instanceof ImageKitTimeoutError;
  const upstreamStatus = getUpstreamStatus(error);

  if (timedOut) {
    return new AppError("IMAGEKIT_TIMEOUT", "The image service took too long to respond. Please try again.", 504);
  }
  if (upstreamStatus === 429) {
    return new AppError("IMAGEKIT_RATE_LIMITED", "Too many image requests. Please try again shortly.", 429);
  }
  return new AppError(code, clientMessage, 502);
};

export const isValidFileId = (value: unknown): value is string =>
  typeof value === "string" && FILE_ID_REGEX.test(value.trim());

export const isManagedPath = (filePath: string): boolean =>
  MANAGED_FOLDERS.some((folder) => filePath === folder || filePath.startsWith(`${folder}/`));

/** Keeps tags short, unique and free of anything that could spoof our internal tag. */
export const sanitizeTags = (tags: unknown): string[] => {
  const list = Array.isArray(tags) ? tags : [];
  const clean = list
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9:_-]/g, "-").slice(0, MAX_TAG_LENGTH))
    .filter((t) => t && t !== PENDING_TAG);
  return [...new Set(clean)].slice(0, MAX_TAGS);
};

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
  if (!isManagedPath(sanitizedFolder)) {
    throw new AppError(
      "INVALID_FOLDER",
      `Folder '${sanitizedFolder}' is not allowed. Use one of: ${MANAGED_FOLDERS.join(", ")}.`,
      400
    );
  }
  const safeFileName = sanitizeFileName(fileName || "upload.png");

  const imagekit = getImageKit();

  try {
    const response = await runImageKit(() => imagekit.upload({
      file,
      fileName: safeFileName,
      folder: sanitizedFolder,
      tags: [...sanitizeTags(tags), PENDING_TAG],
      isPrivateFile,
      useUniqueFileName: false, // We already guarantee unique safe names
    }));

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
    throw toImageKitError(error, "upload", "IMAGEKIT_UPLOAD_ERROR", "Failed to upload image. Please try again.");
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

  // Only files inside our managed folders may be deleted through the API.
  await getManagedFileDetails(cleanFileId);

  try {
    await runImageKit(() => imagekit.deleteFile(cleanFileId));
    return { success: true, fileId: cleanFileId };
  } catch (error: any) {
    if (isNotFound(error)) {
      throw new AppError(
        "FILE_NOT_FOUND",
        `Image with ID '${cleanFileId}' not found or already deleted.`,
        404
      );
    }

    throw toImageKitError(error, "delete", "IMAGEKIT_DELETE_ERROR", "Failed to delete image. Please try again.");
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
    const details = await runImageKit(() => imagekit.getFileDetails(cleanFileId));
    return details;
  } catch (error: any) {
    if (isNotFound(error)) {
      throw new AppError("FILE_NOT_FOUND", `File with ID '${cleanFileId}' was not found.`, 404);
    }
    throw toImageKitError(error, "get details", "IMAGEKIT_DETAILS_ERROR", "Failed to retrieve image details. Please try again.");
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
 * Fetches a file's details and refuses anything outside our managed folders,
 * so callers can never read or delete unrelated files in the ImageKit account.
 */
export const getManagedFileDetails = async (fileId: string) => {
  if (!isValidFileId(fileId)) {
    throw new AppError("INVALID_FILE_ID", "A valid ImageKit file ID is required.", 400);
  }
  const details = await getImageDetails(fileId);
  if (!isManagedPath(details.filePath)) {
    // Same answer as "not found" so file ids outside our folders are not confirmable.
    throw new AppError("FILE_NOT_FOUND", `File with ID '${fileId.trim()}' was not found.`, 404);
  }
  return details;
};

/** Removes the "pending" tag once a file is attached to a record, so cleanup skips it. */
export const markFileAttached = async (fileId: string, tags?: string[] | null): Promise<void> => {
  try {
    const next = (tags ?? []).filter((t) => t !== PENDING_TAG);
    if (next.length === (tags ?? []).length) return; // nothing to change
    await runImageKit(() => getImageKit().updateFileDetails(fileId, { tags: next }));
  } catch (error) {
    // Not fatal: the record is saved; the file just stays tagged and the cleanup script re-checks it.
    logImageKitError(error, "mark attached");
  }
};

/**
 * Best-effort delete for cleanup paths (logo replaced, shop removed).
 * Never throws: the database change that triggered it must not fail because ImageKit did.
 */
export const safeDeleteFile = async (fileId: string | null | undefined): Promise<void> => {
  if (!fileId || !isValidFileId(fileId)) return;
  try {
    ensureImageKitConfigured();
    await runImageKit(() => getImageKit().deleteFile(fileId.trim()));
  } catch (error: any) {
    if (isNotFound(error)) return;
    logImageKitError(error, "safe delete");
  }
};

/** Files still tagged "pending" and older than `olderThanMs`. Used by the cleanup script. */
export const listStalePendingUploads = async (olderThanMs: number) => {
  ensureImageKitConfigured();
  const imagekit = getImageKit();
  const cutoff = Date.now() - olderThanMs;
  const stale: Array<{ fileId: string; filePath: string; createdAt: string }> = [];

  for (let skip = 0; ; skip += 100) {
    const page = await runImageKit(() =>
      imagekit.listFiles({ tags: PENDING_TAG, fileType: "image", limit: 100, skip })
    );
    for (const file of page as any[]) {
      if (isManagedPath(file.filePath) && new Date(file.createdAt).getTime() < cutoff) {
        stale.push({ fileId: file.fileId, filePath: file.filePath, createdAt: file.createdAt });
      }
    }
    if (page.length < 100) break;
  }
  return stale;
};

/**
 * Generates client-side authentication parameters for direct frontend uploads.
 * The token is short-lived. NOTE: direct uploads bypass this server's file checks,
 * so restrict allowed types/size in the ImageKit dashboard too.
 */
export const getClientAuthParameters = () => {
  ensureImageKitConfigured();

  const imagekit = getImageKit();
  const expire = Math.floor(Date.now() / 1000) + 5 * 60;
  return imagekit.getAuthenticationParameters(undefined, expire);
};
