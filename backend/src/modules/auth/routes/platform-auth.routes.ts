import { Router } from "express";
import { signInRequestSchema } from "@pharma/contracts";
import type { Env } from "../../../config/env.ts";
import { originCheck } from "../../../middleware/origin-check.ts";
import { rateLimit } from "../../../middleware/rate-limit.ts";
import { validateBody } from "../../../middleware/validate-body.ts";
import { createPlatformAuthController } from "../controllers/platform-auth.controller.ts";
import type { PlatformAuthService } from "../services/platform-auth.service.ts";

type PlatformAuthRouteEnv = Pick<Env, "CORS_ALLOWED_ORIGINS" | "RATE_LIMIT_SIGN_IN_PER_MINUTE">;

// Routes map paths to controllers and attach middleware; no logic (AGENTS 5). Mounted at
// /platform/auth. Public route: no session or permission applies before sign-in.
export function platformAuthRouter(
  service: PlatformAuthService,
  env: PlatformAuthRouteEnv,
): Router {
  const controller = createPlatformAuthController(service);
  const router = Router();

  router.post(
    "/sign-in/email",
    originCheck(env.CORS_ALLOWED_ORIGINS),
    validateBody(signInRequestSchema),
    // Throttle per IP and submitted email (API.md 8); runs after validation so the key is
    // the normalised email.
    rateLimit(env.RATE_LIMIT_SIGN_IN_PER_MINUTE, (req) => {
      const parsed = signInRequestSchema.safeParse(req.body);
      return `${req.ip ?? "unknown"}|${parsed.success ? parsed.data.email : ""}`;
    }),
    controller.signIn,
  );
  return router;
}
