import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, signAccessToken, type AuthenticatedRequest } from "../middleware/requireAuth";
import { HttpError, asyncHandler } from "../utils/http";

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(100),
});

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const body = signupSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw new HttpError(409, "Email already in use");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });

    const token = signAccessToken(user.id);
    res.status(201).json({ token, user });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = signAccessToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      throw new HttpError(401, "Invalid token");
    }

    res.json({ user });
  }),
);

export default router;
