
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
