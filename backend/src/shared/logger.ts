import { pino } from "pino";
import type { Logger } from "pino";
import type { Env } from "../config/env.ts";

// Never log credentials, tokens or cookies (API.md Section 12).
const REDACTED_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["x-csrf-token"]',
  'res.headers["set-cookie"]',
  "password",
  "*.password",
  "token",
  "*.token",
];

export function createLogger(env: Pick<Env, "LOG_LEVEL">): Logger {
  return pino({
    level: env.LOG_LEVEL,
    redact: { paths: REDACTED_PATHS, censor: "[redacted]" },
  });
}
