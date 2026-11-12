import { Router } from "express";

const READINESS_TIMEOUT_MS = 2_000;

// Liveness and readiness return status only, never details (API.md 6.13).
export function healthRouter(checkDatabase: () => Promise<void>): Router {
  const router = Router();
  router.get("/health/live", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  router.get("/health/ready", async (_req, res) => {
    const timeout = new Promise<never>((_resolve, reject) => {
      setTimeout(
        () => reject(new Error("Readiness check timed out")),
        READINESS_TIMEOUT_MS,
      ).unref();
    });
    try {
      await Promise.race([checkDatabase(), timeout]);
      res.status(200).json({ status: "ok" });
    } catch {
      // Not ready is a defined outcome; the cause stays out of the response.
      res.status(503).json({ status: "unavailable" });
    }
  });
  return router;
}
