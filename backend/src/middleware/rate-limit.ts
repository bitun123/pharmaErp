import type { Request, RequestHandler } from "express";
import { rateLimited } from "../shared/errors.ts";

const WINDOW_MS = 60_000;

interface Counter {
  count: number;
  resetAt: number;
}

// In-memory fixed-window limiter, per instance (API.md 8: acceptable for a single MVP
// instance; several instances need a shared store). Keyed by caller-supplied parts, for
// example IP plus submitted email. Rejections carry Retry-After and RateLimit-* headers.
export function rateLimit(
  limit: number,
  keyOf: (req: Request) => string,
  now: () => number = Date.now,
): RequestHandler {
  const counters = new Map<string, Counter>();

  return (req, res, next) => {
    const time = now();
    for (const [key, counter] of counters) {
      if (counter.resetAt <= time) counters.delete(key);
    }

    const key = keyOf(req);
    const counter = counters.get(key) ?? { count: 0, resetAt: time + WINDOW_MS };
    counter.count += 1;
    counters.set(key, counter);

    const retryAfterSeconds = Math.max(1, Math.ceil((counter.resetAt - time) / 1000));
    res.set("RateLimit-Limit", String(limit));
    res.set("RateLimit-Remaining", String(Math.max(0, limit - counter.count)));
    res.set("RateLimit-Reset", String(retryAfterSeconds));

    if (counter.count > limit) {
      res.set("Retry-After", String(retryAfterSeconds));
      next(rateLimited());
      return;
    }
    next();
  };
}
