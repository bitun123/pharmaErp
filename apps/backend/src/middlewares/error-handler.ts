
import type { ErrorRequestHandler } from "express";
import { AppError } from "../error/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod validation errors
  if (err?.name === "ZodError" && Array.isArray(err?.issues)) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message:
        err.issues.map((i: any) => i.message).join(", ") || "Validation failed.",
      errors: err.issues.map((i: any) => ({
        field: i.path?.join(".") || "unknown",
        message: i.message,
      })),
      statusCode: 400,
    });
  }

  const isAppError = err instanceof AppError;

  const statusCode = isAppError ? err.statusCode : 500;

  res.status(statusCode).json({
    code: isAppError ? err.code : "INTERNAL_SERVER_ERROR",
    message: isAppError
      ? err.message
      : "Internal server error.",
    statusCode,
  });
};
