import type { RequestHandler } from "express";
import { signInRequestSchema } from "@pharma/contracts";
import type { PlatformAuthService } from "../services/platform-auth.service.ts";

// Controllers parse validated input, call one service method and shape the response.
export function createPlatformAuthController(service: PlatformAuthService): {
  signIn: RequestHandler;
} {
  return {
    signIn: async (req, res, next) => {
      try {
        // Already validated by the route middleware; parsed again only to obtain the type.
        const input = signInRequestSchema.parse(res.locals["body"]);
        const result = await service.signIn({
          ...input,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
        for (const cookie of result.setCookies) res.append("Set-Cookie", cookie);
        res.set("Cache-Control", "no-store");
        res.status(200).json(result.body);
      } catch (error) {
        next(error);
      }
    },
  };
}
