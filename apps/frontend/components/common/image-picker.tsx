"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES, formatBytes } from "@/lib/image-file";
import { cn } from "@/lib/utils";

export type ImagePickerStatus = "idle" | "uploading" | "uploaded" | "error";

type ImagePickerProps = {
  file: File | null;
  status: ImagePickerStatus;
  /** Why the file was rejected or the upload failed. */
  error?: string | null;
  /** Show a Retry button (for upload failures, not for files rejected in the browser). */
  canRetry?: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
  onRetry?: () => void;
  /** Locks the picker (for example while the whole form is being saved). */
  disabled?: boolean;
  /** Accessible name and text of the drop area. */
  label?: string;
};

/** Shows the chosen image. The temporary URL is created and released inside the effect, so it is never leaked. */
function Preview({ file }: { file: File }) {
  const ref = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // eslint-disable-next-line @next/next/no-img-element -- a local blob URL cannot go through next/image
  return <img ref={ref} alt="Selected logo preview" className="size-16 shrink-0 rounded-lg border border-border bg-muted object-contain" />;
}

/**
 * Choose an image by click or drag and drop and see how its upload is going.
 * It only displays state: whoever uses it checks the file, uploads it and decides what "remove" means.
 */
export function ImagePicker({
  file,
  status,
  error,
  canRetry = false,
  onPick,
  onRemove,
  onRetry,
  disabled,
  label = "Choose an image",
}: ImagePickerProps) {
  const inputId = React.useId();
  const [dragging, setDragging] = React.useState(false);
  const failed = status === "error";

  const pick = (files: FileList | null) => {
    const picked = files?.[0];
    if (picked) onPick(picked);
  };

  return (
    <div className="space-y-1.5">
      {file ? (
        <div className={cn("flex items-center gap-3 rounded-lg border p-3", failed ? "border-destructive" : "border-input")}>
          {failed ? (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-error-container text-on-error-container">
              <AlertCircle className="size-6" />
            </div>
          ) : (
            <div className="relative">
              <Preview file={file} />
              {status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                  <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
                </div>
              )}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate text-sm font-medium" title={file.name}>{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            <p role="status" aria-live="polite" className="flex items-center gap-1 text-xs">
              {status === "uploading" && <span className="text-muted-foreground">Uploading...</span>}
              {status === "uploaded" && (
                <span className="flex items-center gap-1 text-[#17B880] dark:text-[#37D298]">
                  <CheckCircle2 className="size-3.5" /> Uploaded
                </span>
              )}
            </p>
          </div>

          {failed && canRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={disabled}
              aria-label="Try uploading again"
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={status === "uploading" ? "Cancel upload" : "Remove logo"}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!disabled) pick(event.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring",
            dragging ? "border-primary bg-primary/5" : "border-input hover:border-outline hover:bg-muted/40",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <ImagePlus className="size-6 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">
            Click or drop here. JPEG, PNG, WEBP or GIF, up to {formatBytes(IMAGE_MAX_BYTES)}.
          </span>
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          pick(event.target.files);
          // Lets the same file be chosen again after it was removed.
          event.target.value = "";
        }}
      />

      {failed && error && (
        <p role="alert" className="flex items-center gap-1 text-[11px] font-medium text-destructive">
          <AlertCircle className="size-3 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
