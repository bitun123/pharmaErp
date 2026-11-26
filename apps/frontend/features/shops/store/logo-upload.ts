import { ApiError } from "@/lib/client";
import { getErrorFriendlyMessage } from "@/lib/errorFriendlyMessage";
import { validateImageFile } from "@/lib/image-file";

/**
 * The logo upload rules, with no React in them so every edge case can be tested directly.
 * Flow: a picked file is uploaded at once. The backend returns a `fileId`, and the form sends that
 * id later when the shop is registered.
 */

export type LogoUploadStatus = "idle" | "uploading" | "uploaded" | "error";

export type LogoUploadState = {
  file: File | null;
  status: LogoUploadStatus;
  /** Set only while status is "uploaded". */
  fileId: string | null;
  error: string | null;
  /** True for upload failures (network, server). False for a file that was rejected in the browser. */
  canRetry: boolean;
};

export const LOGO_UPLOAD_IDLE: LogoUploadState = { file: null, status: "idle", fileId: null, error: null, canRetry: false };

export type LogoUploadAction =
  | { type: "reset" }
  | { type: "invalid"; file: File; error: string }
  | { type: "uploading"; file: File }
  | { type: "uploaded"; fileId: string }
  | { type: "failed"; error: string };

/** Late or repeated results (for example from a replaced upload) cannot change the wrong state. */
export function logoUploadReducer(state: LogoUploadState, action: LogoUploadAction): LogoUploadState {
  switch (action.type) {
    case "reset":
      return LOGO_UPLOAD_IDLE;
    case "invalid":
      return { file: action.file, status: "error", fileId: null, error: action.error, canRetry: false };
    case "uploading":
      return { file: action.file, status: "uploading", fileId: null, error: null, canRetry: false };
    case "uploaded":
      return state.status === "uploading" ? { ...state, status: "uploaded", fileId: action.fileId, error: null } : state;
    case "failed":
      return state.status === "uploading" ? { ...state, status: "error", fileId: null, error: action.error, canRetry: true } : state;
  }
}

/** The form must not be submitted while the logo is uploading or has failed (it would silently lose the logo). */
export const logoBlocksSubmit = (state: LogoUploadState) => state.status === "uploading" || state.status === "error";

/** A message for an upload that failed. Sign-in and permission problems get their own wording. */
export function describeUploadError(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return "Your session expired. Please sign in again.";
  if (error instanceof ApiError && error.status === 403) return "You don't have permission to upload images.";
  return getErrorFriendlyMessage(error);
}

/** An upload that takes longer than this is cancelled and reported as failed. */
export const UPLOAD_TIMEOUT_MS = 60_000;

export type LogoUploaderDeps = {
  folder: string;
  /** Overrides UPLOAD_TIMEOUT_MS (mainly for tests). */
  timeoutMs?: number;
  upload: (params: { file: File; folder: string; signal: AbortSignal }) => Promise<{ fileId: string }>;
  remove: (fileId: string) => Promise<unknown>;
  /** Called with the new id when a logo is stored, and with null when it is gone. */
  onFileIdChange?: (fileId: string | null) => void;
};

/**
 * Owns the whole upload lifecycle for one logo:
 * - picking validates in the browser, then uploads right away;
 * - picking again cancels the running upload and deletes the previous file (best effort);
 * - a result that arrives for a file that is no longer wanted is deleted, never used;
 * - `markSaved` hands the file over to the saved shop so it is not deleted;
 * - `dispose` throws away anything that was never saved.
 * Deletes never throw: the cleanup script on the backend catches anything that slips through.
 */
export function createLogoUploader(deps: LogoUploaderDeps) {
  let state = LOGO_UPLOAD_IDLE;
  let attempt = 0;
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let storedFileId: string | null = null;
  let onFileIdChange = deps.onFileIdChange;
  const listeners = new Set<() => void>();

  const dispatch = (action: LogoUploadAction) => {
    const next = logoUploadReducer(state, action);
    if (next === state) return;
    state = next;
    listeners.forEach((listener) => listener());
  };

  const deleteQuietly = (fileId: string | null) => {
    if (!fileId) return;
    void deps.remove(fileId).catch(() => {});
  };

  /** Stops the running upload and makes any result it still produces count as stale. */
  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const cancelCurrent = () => {
    attempt += 1;
    clearTimer();
    controller?.abort();
    controller = null;
  };

  const forgetStored = () => {
    const fileId = storedFileId;
    storedFileId = null;
    deleteQuietly(fileId);
    if (fileId) onFileIdChange?.(null);
  };

  const start = (file: File) => {
    const mine = attempt;
    const current = new AbortController();
    controller = current;
    let timedOut = false;
    clearTimer();
    timer = setTimeout(() => {
      timedOut = true;
      current.abort();
    }, deps.timeoutMs ?? UPLOAD_TIMEOUT_MS);
    dispatch({ type: "uploading", file });

    deps
      .upload({ file, folder: deps.folder, signal: current.signal })
      .then((image) => {
        if (mine === attempt) clearTimer();
        if (mine !== attempt) {
          // The user moved on (picked another file, removed it, or closed the form) before this finished.
          deleteQuietly(image.fileId);
          return;
        }
        storedFileId = image.fileId;
        dispatch({ type: "uploaded", fileId: image.fileId });
        onFileIdChange?.(image.fileId);
      })
      .catch((error: unknown) => {
        if (mine !== attempt) return;
        clearTimer();
        if (error instanceof ApiError && error.code === "ABORTED") {
          // Aborted by us: either the user moved on (nothing to show) or the upload timed out.
          if (timedOut) dispatch({ type: "failed", error: "The upload took too long. Check your connection and try again." });
          return;
        }
        dispatch({ type: "failed", error: describeUploadError(error) });
      });
  };

  return {
    getState: () => state,

    /** Lets the form swap its callback between renders without recreating the uploader. */
    setOnFileIdChange(callback: ((fileId: string | null) => void) | undefined) {
      onFileIdChange = callback;
    },

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    pick(file: File) {
      cancelCurrent();
      forgetStored();

      const problem = validateImageFile(file);
      if (problem) {
        dispatch({ type: "invalid", file, error: problem });
        return;
      }
      start(file);
    },

    /** Tries again after an upload failure. Does nothing for a file that was rejected in the browser. */
    retry() {
      if (!state.file || !state.canRetry) return;
      cancelCurrent();
      start(state.file);
    },

    /** Removes the logo: cancels a running upload and deletes an uploaded file. */
    remove() {
      cancelCurrent();
      forgetStored();
      dispatch({ type: "reset" });
    },

    /** The shop was saved with this file, so from now on it belongs to the shop. Never delete it. */
    markSaved() {
      storedFileId = null;
    },

    /** Called when the form goes away: cancel and delete whatever was not saved. Safe to call more than once. */
    dispose() {
      cancelCurrent(); // also stops the timeout timer
      const fileId = storedFileId;
      storedFileId = null;
      deleteQuietly(fileId);
      state = LOGO_UPLOAD_IDLE;
    },
  };
}

export type LogoUploader = ReturnType<typeof createLogoUploader>;
