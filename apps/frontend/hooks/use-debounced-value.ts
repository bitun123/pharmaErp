import * as React from "react"

/**
 * Returns `value` only after it has stopped changing for `delay` ms.
 * Reusable anywhere an input should not trigger work on every keystroke (e.g. server search).
 * The pending timer is cleared on every change and on unmount, so a stale value never fires late.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), Math.max(0, delay))
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
