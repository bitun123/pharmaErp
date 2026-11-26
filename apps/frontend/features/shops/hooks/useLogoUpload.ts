"use client";

import * as React from "react";
import { deleteImage, uploadImage } from "@/features/media/api/media.api";
import { createLogoUploader, logoBlocksSubmit } from "../store/logo-upload";

/**
 * React wrapper around the logo uploader. The form reads the state and calls the actions;
 * all upload rules (cancel, replace, cleanup) live in store/logo-upload.ts.
 */
export function useLogoUpload({ folder, onFileIdChange }: { folder: string; onFileIdChange?: (fileId: string | null) => void }) {
  const [uploader] = React.useState(() => createLogoUploader({ folder, upload: uploadImage, remove: deleteImage }));

  // Always call the form's latest callback.
  React.useEffect(() => {
    uploader.setOnFileIdChange(onFileIdChange);
  });

  // Leaving the page with an unsaved upload cancels and deletes it.
  React.useEffect(() => () => uploader.dispose(), [uploader]);

  const state = React.useSyncExternalStore(uploader.subscribe, uploader.getState, uploader.getState);

  return {
    ...state,
    blocksSubmit: logoBlocksSubmit(state),
    pick: uploader.pick,
    retry: uploader.retry,
    remove: uploader.remove,
    markSaved: uploader.markSaved,
  };
}
