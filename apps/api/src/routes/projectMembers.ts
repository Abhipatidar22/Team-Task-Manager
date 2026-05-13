import { ProjectRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import type { AuthenticatedRequest } from "../middleware/requireAuth";
import { requireProjectMember, requireProjectRole, type ProjectRequest } from "../middleware/projectAccess";
import { HttpError, asyncHandler } from "../utils/http";

const router = Router({ mergeParams: true });

const addMemberSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  role: z.nativeEnum(ProjectRole).optional(),
});

const updateRoleSchema = z.object({
  role: z.nativeEnum(ProjectRole),
});

router.get(
  "/",
  requireProjectMember,
  asyncHandler(async (req, res) => {
    const projectId = (req as ProjectRequest).membership.projectId;

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    res.json({
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    });
  }),
);

router.post(
  "/",
  requireProjectRole([ProjectRole.ADMIN]),
  asyncHandler(async (req, res) => {
    const projectId = (req as ProjectRequest).membership.projectId;
    const body = addMemberSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      throw new HttpError(404, "User not found. Ask them to sign up first.");
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (existing) {
      throw new HttpError(409, "User is already a member of this project");
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: body.role ?? ProjectRole.MEMBER,
      },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    res.status(201).json({
      member: {
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user,
      },
    });
  }),
);

router.patch(
  "/:memberId",
  requireProjectRole([ProjectRole.ADMIN]),
  asyncHandler(async (req, res) => {
    const projectId = (req as ProjectRequest).membership.projectId;
    const memberIdParam = req.params.memberId;
    if (typeof memberIdParam !== "string" || !memberIdParam) {
      throw new HttpError(400, "Missing memberId");
    }
    const memberId = memberIdParam;
    const body = updateRoleSchema.parse(req.body);

    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) {
      throw new HttpError(404, "Member not found");
    }

    if (member.role === ProjectRole.ADMIN && body.role !== ProjectRole.ADMIN) {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: ProjectRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new HttpError(400, "Project must have at least one admin");
      }
    }

    const updated = await prisma.projectMember.update({
      where: { id: member.id },
      data: { role: body.role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    res.json({
      member: {
        id: updated.id,
        role: updated.role,
        joinedAt: updated.joinedAt,
        user: updated.user,
      },
    });
  }),
);

router.delete(
  "/:memberId",
  requireProjectRole([ProjectRole.ADMIN]),
  asyncHandler(async (req, res) => {
    const projectId = (req as ProjectRequest).membership.projectId;
    const memberIdParam = req.params.memberId;
    if (typeof memberIdParam !== "string" || !memberIdParam) {
      throw new HttpError(400, "Missing memberId");
    }
    const memberId = memberIdParam;
    const currentUserId = (req as AuthenticatedRequest).user.id;

    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) {
      throw new HttpError(404, "Member not found");
    }

    if (member.role === ProjectRole.ADMIN) {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: ProjectRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new HttpError(400, "Project must have at least one admin");
      }
    }

    // Allow removing self as long as at least one admin remains.
    await prisma.projectMember.delete({ where: { id: member.id } });

    res.json({
      removed: {
        id: member.id,
        userId: member.userId,
        wasSelf: member.userId === currentUserId,
      },
    });
  }),
);

export default router;
