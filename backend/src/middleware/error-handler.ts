import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ErrorResponse } from "@pharma/contracts";
import { AppError, notFound } from "../shared/errors.ts";

function body(req: { id?: unknown }, code: ErrorResponse["error"]["code"], message: string) {
  return {
    error: { code, message, requestId: String(req.id ?? "unknown") },
  } satisfies ErrorResponse;
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(notFound());
};

// Central error handler: never exposes stack traces, SQL, file paths or internals.
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    const payload: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        requestId: String(req.id ?? "unknown"),
        ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
        ...(err.details ? { details: err.details } : {}),
      },
    };
    res.status(err.status).json(payload);
    return;
  }

  // Malformed JSON and oversize bodies raised by the body parser.
  const parserError = err as { type?: string };
  if (parserError.type === "entity.parse.failed") {
    res.status(400).json(body(req, "malformed_request", "The request body is not valid JSON."));
    return;
  }
  if (parserError.type === "entity.too.large") {
    res.status(413).json(body(req, "payload_too_large", "The request body is too large."));
    return;
  }

  req.log.error({ err }, "Unhandled error");
  res.status(500).json(body(req, "internal_error", "Something went wrong. Please try again."));
};
