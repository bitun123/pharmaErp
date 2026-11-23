import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** "full" = icon + wordmark, "icon" = icon only. */
  variant?: "full" | "icon";
  /** Pin one artwork regardless of theme (e.g. on an always-dark panel). */
  theme?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
};

// Intrinsic sizes of the files in /public/brand.
const SIZES = {
  full: { width: 900, height: 296 },
  icon: { width: 320, height: 304 },
} as const;

/**
 * Pharma ERP logo. "auto" renders both artworks and lets CSS show the one for
 * the active theme, so there is no flash or hydration mismatch.
 * Size it with a height class, e.g. className="h-9 w-auto".
 */
export function Logo({ variant = "full", theme = "auto", className, priority }: LogoProps) {
  const { width, height } = SIZES[variant];
  const img = (mode: "light" | "dark", extra: string) => (
    <Image
      src={`/brand/${variant === "full" ? "logo" : "icon"}-${mode}.png`}
      alt={mode === (theme === "auto" ? "light" : theme) ? "Pharma ERP" : ""}
      aria-hidden={mode !== (theme === "auto" ? "light" : theme) ? true : undefined}
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto max-w-full select-none", extra, className)}
      draggable={false}
    />
  );

  if (theme !== "auto") return img(theme, "");
  return (
    <>
      {img("light", "dark:hidden")}
      {img("dark", "hidden dark:block")}
    </>
  );
}
