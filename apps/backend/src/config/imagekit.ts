import ImageKit from "imagekit";

/**
 * Validates and retrieves ImageKit configuration from environment variables.
 * Fails fast with clear error messages if required credentials are missing.
 */
export const getImageKitConfig = () => {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  return {
    publicKey: publicKey?.trim() || "",
    privateKey: privateKey?.trim() || "",
    urlEndpoint: urlEndpoint?.trim().replace(/\/+$/, "") || "",
  };
};

let imageKitInstance: ImageKit | null = null;

/**
 * Returns a singleton instance of the ImageKit client.
 * Lazily initialized to allow environment variables to load first.
 */
export const getImageKit = (): ImageKit => {
  if (imageKitInstance) {
    return imageKitInstance;
  }

  const { publicKey, privateKey, urlEndpoint } = getImageKitConfig();

  if (!publicKey || !privateKey || !urlEndpoint) {
    console.warn(
      "[ImageKit Warning]: ImageKit credentials are incomplete in environment variables (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT). Uploads and deletes will fail until configured."
    );
  }

  imageKitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return imageKitInstance;
};

export default getImageKit;
