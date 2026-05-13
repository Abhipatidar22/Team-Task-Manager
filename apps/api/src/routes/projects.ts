import { ProjectRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { requireProjectMember, requireProjectRole, type ProjectRequest } from "../middleware/projectAccess";
import { asyncHandler } from "../utils/http";
import membersRouter from "./projectMembers";
import tasksRouter from "./projectTasks";

const router = Router();

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user.id;

    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        _count: { select: { members: true, tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        memberCount: p._count.members,
        taskCount: p._count.tasks,
      })),
    });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user.id;
    const body = createProjectSchema.parse(req.body);

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: { name: body.name },
      });

      await tx.projectMember.create({
        data: {
          projectId: created.id,
          userId,
          role: ProjectRole.ADMIN,
        },
      });

      return created;
    });

    res.status(201).json({ project });
  }),
);

router.get(
  "/:projectId",
  requireProjectMember,
  asyncHandler(async (req, res) => {
    const projectId = (req as ProjectRequest).membership.projectId;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: { select: { members: true, tasks: true } },
      },
    });

    res.json({
      project: project
        ? {
            id: project.id,
            name: project.name,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            memberCount: project._count.members,
            taskCount: project._count.tasks,
          }
        : null,
    });
  }),
);

router.patch(
  "/:projectId",
  requireProjectRole([ProjectRole.ADMIN]),
  asyncHandler(async (req, res) => {
    const projectId = (req as ProjectRequest).membership.projectId;
    const body = updateProjectSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name: body.name },
    });

    res.json({ project });
  }),
);

router.delete(
  "/:projectId",
  requireProjectRole([ProjectRole.ADMIN]),
  asyncHandler(async (req, res) => {
    const projectId = (req as ProjectRequest).membership.projectId;

    await prisma.project.delete({ where: { id: projectId } });
    res.json({ deleted: { id: projectId } });
  }),
);

router.use("/:projectId/members", membersRouter);
router.use("/:projectId/tasks", tasksRouter);

export default router;
