import type { RequestHandler } from "express";
import type { z } from "zod";
import { AppError, validationFailed } from "../shared/errors.ts";

// Validates the JSON body with a shared schema (AGENTS 8). Later handlers read the parsed
// value from res.locals.body, never from req.body.
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    // express.json() leaves req.body undefined for a missing or non-JSON content type.
    if (req.body === undefined) {
      next(new AppError("malformed_request", 400, "The request body must be JSON."));
      return;
    }
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        validationFailed(
          result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            code: issue.code,
            message: issue.message,
          })),
        ),
      );
      return;
    }
    res.locals["body"] = result.data;
    next();
  };
}
