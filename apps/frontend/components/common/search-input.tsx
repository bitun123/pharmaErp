"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  /** The committed search text (for example from the URL). The box follows it when it changes. */
  value: string;
  /** Called with the trimmed text, after the user pauses typing, on Enter, or when cleared. */
  onSearch: (value: string) => void;
  placeholder?: string;
  /** Accessible name. Defaults to the placeholder. */
  label?: string;
  delay?: number;
  maxLength?: number;
  className?: string;
  /** Extra classes for the text box itself (the wrapper takes `className`). */
  inputClassName?: string;
};

/**
 * Debounced search box. It never fires per keystroke, ignores whitespace-only changes,
 * and stays in sync when the committed value changes from outside (back button, "clear filters").
 */
export function SearchInput({
  value,
  onSearch,
  placeholder = "Search...",
  label,
  delay = 400,
  maxLength = 100,
  className,
  inputClassName,
}: SearchInputProps) {
  const [text, setText] = React.useState(value);

  // Follow outside changes (adjusting state during render is the React-recommended way to do this).
  const [seenValue, setSeenValue] = React.useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    // Skip when the change is our own commit (the trimmed text), so typing "abc d" keeps its space.
    if (value !== text.trim()) setText(value);
  }

  const debounced = useDebouncedValue(text, delay);

  // Keep the latest callback and committed value without re-running the debounce effect.
  const latest = React.useRef({ value, onSearch });
  React.useEffect(() => {
    latest.current = { value, onSearch };
  });

  // Only a pause in typing reaches the parent, and only when it actually changes the search.
  React.useEffect(() => {
    const next = debounced.trim();
    if (next !== latest.current.value) latest.current.onSearch(next);
  }, [debounced]);

  const commitNow = (next: string) => {
    const trimmed = next.trim();
    if (trimmed !== latest.current.value) onSearch(trimmed);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        autoComplete="off"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commitNow(text);
        }}
        className={cn("h-10 pr-9 pl-9 text-sm [&::-webkit-search-cancel-button]:hidden", inputClassName)}
      />
      {text && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setText("");
            commitNow("");
          }}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
