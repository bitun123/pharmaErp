export type DetectedImage = {
  /** Canonical MIME type, taken from the file's bytes, never from the client. */
  mime: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  /** Canonical extension, including the dot. */
  ext: ".jpg" | ".png" | ".gif" | ".webp";
};

const startsWith = (buf: Buffer, bytes: number[], offset = 0) =>
  buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);

/**
 * Identifies an image by its magic bytes. Returns null for anything that is not a
 * JPEG, PNG, GIF or WEBP, including SVG/HTML/scripts renamed to look like images.
 */
export const detectImageType = (buf: Buffer): DetectedImage | null => {
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: ".jpg" };
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: "image/png", ext: ".png" };
  }
  // "GIF87a" / "GIF89a"
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || startsWith(buf, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) {
    return { mime: "image/gif", ext: ".gif" };
  }
  // "RIFF" .... "WEBP"
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { mime: "image/webp", ext: ".webp" };
  }
  return null;
};
