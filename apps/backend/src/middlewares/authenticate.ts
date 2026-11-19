import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../module/auth/config/auth.js";
import { AppError } from "../error/app-error.js";
import type { PlatformRole } from "../generated/prisma/enums.js";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        sessionId: string;
        name: string | null;
        role: PlatformRole;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new AppError("UNAUTHORIZED", "Authentication required.", 401);
    }

    req.user = {
      id: session.user.id,
      sessionId: session.session.id,
      name: session.user.name,
      role: ((session.user as Record<string, unknown>).role as PlatformRole) ?? "STAFF",
    };

    next();
  } catch (error) {
    next(error);
  }
};
