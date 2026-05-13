import { ProjectRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db";
import { HttpError, asyncHandler } from "../utils/http";
import type { AuthenticatedRequest } from "./requireAuth";

export type ProjectMembership = { projectId: string; role: ProjectRole };
export type ProjectRequest = AuthenticatedRequest & { membership: ProjectMembership };

export const requireProjectMember = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const projectIdParam = req.params.projectId;
  if (typeof projectIdParam !== "string" || !projectIdParam) {
    throw new HttpError(400, "Missing projectId");
  }
  const projectId = projectIdParam;

  const userId = (req as AuthenticatedRequest).user?.id;
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new HttpError(403, "Not a member of this project");
  }

  (req as ProjectRequest).membership = { projectId, role: membership.role };
  next();
});

export function requireProjectRole(roles: ProjectRole[]) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const projectIdParam = req.params.projectId;
    if (typeof projectIdParam !== "string" || !projectIdParam) {
      throw new HttpError(400, "Missing projectId");
    }
    const projectId = projectIdParam;

    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new HttpError(403, "Not a member of this project");
    }

    if (!roles.includes(membership.role)) {
      throw new HttpError(403, "Insufficient permissions");
    }

    (req as ProjectRequest).membership = { projectId, role: membership.role };
    next();
  });
}
