import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { HttpError } from "../utils/http";

export type AuthUser = { id: string };
export type AuthenticatedRequest = Request & { user: AuthUser };

export function signAccessToken(userId: string) {
  return jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: "7d" });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return next(new HttpError(401, "Missing Bearer token"));
  }

  try {
    const payload = jwt.verify(match[1], env.JWT_SECRET) as jwt.JwtPayload;
    const sub = payload.sub;
    if (!sub) {
      return next(new HttpError(401, "Invalid token"));
    }

    (req as AuthenticatedRequest).user = { id: String(sub) };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid token"));
  }
}
