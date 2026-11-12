import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

// Every request gets a server-generated ID, returned in X-Request-Id and in error bodies.
// A client-supplied ID is never trusted.
export const requestId: RequestHandler = (req, res, next) => {
  const id = randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
};
