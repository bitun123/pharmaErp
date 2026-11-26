import { api } from "@/lib/client";

// The media API on the backend (reached through the same-origin /api rewrite).
const MEDIA = "/api/media";

/** What the backend returns for a stored image. `fileId` is what other records (like a shop) keep. */
export type UploadedImage = {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  filePath: string;
  size: number;
  fileType: string;
  width?: number;
  height?: number;
};

type UploadImageResponse = { success: boolean; message?: string; data: UploadedImage };

/**
 * Uploads one image. The backend only accepts the form field `image`, and only these folders:
 * shops/logos, users/avatars, general. Pass a signal to cancel the upload.
 */
export async function uploadImage(params: { file: File; folder: string; signal?: AbortSignal }): Promise<UploadedImage> {
  const form = new FormData();
  form.append("folder", params.folder);
  form.append("image", params.file);

  const response = await api.upload<UploadImageResponse>(`${MEDIA}/upload`, form, { signal: params.signal });
  return response.data;
}

/** Deletes an uploaded image. The backend refuses (409 FILE_IN_USE) when a shop is using it. */
export function deleteImage(fileId: string) {
  return api.delete<{ success: boolean }>(`${MEDIA}/${encodeURIComponent(fileId)}`);
}
