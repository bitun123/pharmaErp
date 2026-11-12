import type { RequestHandler } from "express";
import { csrfInvalid } from "../shared/errors.ts";

// CSRF defence for state-changing requests (API.md 4.1): the Origin header must be in the
// trusted list. A request without an Origin header (a non-browser client) carries no
// ambient browser cookie, so it is not a CSRF vector; a browser always sends Origin on POST.
export function originCheck(trustedOrigins: readonly string[]): RequestHandler {
  const trusted = new Set(trustedOrigins);
  return (req, _res, next) => {
    const origin = req.get("origin");
    if (origin !== undefined && !trusted.has(origin)) {
      next(csrfInvalid());
      return;
    }
    next();
  };
}
