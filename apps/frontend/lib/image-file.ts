/** Same limits as the backend upload (JPEG, PNG, WEBP, GIF up to 5 MB). The server checks again. */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

/** An error message for a file that cannot be uploaded as an image, or null when it is fine. */
export function validateImageFile(file: File, maxBytes = IMAGE_MAX_BYTES): string | null {
  if (file.size === 0) return "This file is empty.";
  if (file.size > maxBytes) return `This image is too large (${formatBytes(file.size)}). The maximum is ${formatBytes(maxBytes)}.`;

  const name = file.name.toLowerCase();
  if (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return "Only JPEG, PNG, WEBP and GIF images are allowed.";
  }
  return null;
}
