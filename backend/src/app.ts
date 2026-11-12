import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import type { Env } from "./config/env.ts";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.ts";
import { requestId } from "./middleware/request-id.ts";
import { PLATFORM_AUTH_BASE_PATH } from "./modules/auth/services/platform-auth.better-auth.ts";
import { platformAuthRouter } from "./modules/auth/routes/platform-auth.routes.ts";
import type { PlatformAuthService } from "./modules/auth/services/platform-auth.service.ts";
import { healthRouter } from "./modules/health/routes/health.routes.ts";

const JSON_BODY_LIMIT = "1mb";

// App factory: configuration and logger are passed in so tests can build isolated apps.
// Pipeline order follows ARCHITECTURE 4.3 (session, tenant and authorization middleware
// are added in later phases).
export function createApp(
  env: Env,
  logger: Logger,
  checkDatabase: () => Promise<void>,
  platformAuthService: PlatformAuthService,
): express.Express {
  const app = express();
  app.disable("x-powered-by");

  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => String(req.id ?? "unknown") }));
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ALLOWED_ORIGINS, credentials: true }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use(healthRouter(checkDatabase));
  app.use(PLATFORM_AUTH_BASE_PATH, platformAuthRouter(platformAuthService, env));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
