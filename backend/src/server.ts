import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { createApp } from "./app.ts";
import { loadEnv } from "./config/env.ts";
import { createPlatformAuth } from "./modules/auth/services/platform-auth.better-auth.ts";
import { PlatformAuthRepository } from "./modules/auth/repositories/platform-auth.repository.ts";
import { createPlatformAuthService } from "./modules/auth/services/platform-auth.service.ts";
import {
  checkDatabase,
  connectDatabase,
  createPrismaClient,
  disconnectDatabase,
} from "./database/prisma-client.ts";
import { createLogger } from "./shared/logger.ts";

// The shared .env lives at the repository root; a missing file is fine (variables may
// come from the host environment).
loadDotenv({ path: resolve(import.meta.dirname, "../../.env"), quiet: true });

const env = loadEnv();
const logger = createLogger(env);
const prisma = createPrismaClient(env);
await connectDatabase(prisma, logger);
const platformAuthService = createPlatformAuthService(
  createPlatformAuth(prisma, env),
  new PlatformAuthRepository(prisma),
  { maxFailedAttempts: env.LOGIN_MAX_FAILED_ATTEMPTS, lockoutMinutes: env.LOGIN_LOCKOUT_MINUTES },
);
const app = createApp(env, logger, () => checkDatabase(prisma), platformAuthService);

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Server is running");
});

// Graceful shutdown: stop accepting requests and let in-flight ones finish.
function shutdown(signal: string): void {
  logger.info({ signal }, "Shutting down");
  server.close((error) => {
    if (error) {
      logger.error({ err: error }, "Error during shutdown");
      process.exit(1);
    }
    disconnectDatabase(prisma, logger)
      .then(() => process.exit(0))
      .catch((disconnectError: unknown) => {
        logger.error({ err: disconnectError }, "Error closing database connection");
        process.exit(1);
      });
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
