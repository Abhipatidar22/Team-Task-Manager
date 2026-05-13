import { ProjectRole, TaskStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import type { AuthenticatedRequest } from "../middleware/requireAuth";
import { requireProjectMember, type ProjectRequest } from "../middleware/projectAccess";
import { HttpError, asyncHandler } from "../utils/http";

const router = Router({ mergeParams: true });

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().cuid().optional().nullable(),
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    assignedToId: z.string().cuid().optional().nullable(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "No fields to update" });

router.get(
  "/",
  requireProjectMember,
  asyncHandler(async (req, res) => {
    const projectId = (req as ProjectRequest).membership.projectId;

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { id: true, email: true, name: true } },
        createdBy: { select: { id: true, email: true, name: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    res.json({
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        dueDate: t.dueDate,
        assignedTo: t.assignedTo,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  }),
);

router.post(
  "/",
  requireProjectMember,
  asyncHandler(async (req, res) => {
    const { projectId, role } = (req as ProjectRequest).membership;
    const userId = (req as AuthenticatedRequest).user.id;

    const body = createTaskSchema.parse(req.body);
    const assignedToId = body.assignedToId ?? null;

    const isAdmin = role === ProjectRole.ADMIN;
    if (assignedToId && !isAdmin && assignedToId !== userId) {
      throw new HttpError(403, "Members can only assign tasks to themselves");
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title: body.title,
        description: body.description,
        status: body.status ?? TaskStatus.TODO,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assignedToId,
        createdById: userId,
      },
    });

    res.status(201).json({ task });
  }),
);

router.patch(
  "/:taskId",
  requireProjectMember,
  asyncHandler(async (req, res) => {
    const { projectId, role } = (req as ProjectRequest).membership;
    const userId = (req as AuthenticatedRequest).user.id;
    const taskIdParam = req.params.taskId;
    if (typeof taskIdParam !== "string" || !taskIdParam) {
      throw new HttpError(400, "Missing taskId");
    }
    const taskId = taskIdParam;

    const body = updateTaskSchema.parse(req.body);

    const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) {
      throw new HttpError(404, "Task not found");
    }

    const isAdmin = role === ProjectRole.ADMIN;
    const isCreator = task.createdById === userId;
    const isAssignee = task.assignedToId === userId;

    if (!isAdmin) {
      if (body.assignedToId !== undefined && body.assignedToId !== null && body.assignedToId !== userId) {
        throw new HttpError(403, "Members can only assign tasks to themselves");
      }

      const editsMeta = body.title !== undefined || body.description !== undefined || body.dueDate !== undefined;
      if (editsMeta && !isCreator) {
        throw new HttpError(403, "Only the task creator (or admin) can edit title/description/due date");
      }

      if (body.status !== undefined && !(isAssignee || isCreator)) {
        throw new HttpError(403, "Only the assignee or creator (or admin) can update status");
      }
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: body.title,
        description: body.description === undefined ? undefined : body.description,
        status: body.status,
        dueDate: body.dueDate === undefined ? undefined : body.dueDate === null ? null : new Date(body.dueDate),
        assignedToId: body.assignedToId === undefined ? undefined : body.assignedToId,
      },
    });

    res.json({ task: updated });
  }),
);

router.delete(
  "/:taskId",
  requireProjectMember,
  asyncHandler(async (req, res) => {
    const { projectId, role } = (req as ProjectRequest).membership;
    const userId = (req as AuthenticatedRequest).user.id;
    const taskIdParam = req.params.taskId;
    if (typeof taskIdParam !== "string" || !taskIdParam) {
      throw new HttpError(400, "Missing taskId");
    }
    const taskId = taskIdParam;

    const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) {
      throw new HttpError(404, "Task not found");
    }

    const isAdmin = role === ProjectRole.ADMIN;
    const isCreator = task.createdById === userId;

    if (!isAdmin && !isCreator) {
      throw new HttpError(403, "Only the task creator (or admin) can delete this task");
    }

    await prisma.task.delete({ where: { id: task.id } });
    res.json({ deleted: { id: task.id } });
  }),
);

export default router;
