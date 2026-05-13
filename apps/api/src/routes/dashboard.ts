import { Router } from "express";
import { TaskStatus } from "@prisma/client";
import { prisma } from "../db";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/http";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user.id;
    const now = new Date();

    const [tasks, overdueCount, grouped] = await Promise.all([
      prisma.task.findMany({
        where: { assignedToId: userId },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 100,
      }),
      prisma.task.count({
        where: {
          assignedToId: userId,
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
        },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: { assignedToId: userId },
        _count: { _all: true },
      }),
    ]);

    const byStatus = grouped.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

    res.json({
      counts: {
        TODO: byStatus[TaskStatus.TODO] ?? 0,
        IN_PROGRESS: byStatus[TaskStatus.IN_PROGRESS] ?? 0,
        DONE: byStatus[TaskStatus.DONE] ?? 0,
      },
      overdueCount,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
        project: t.project,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  }),
);

export default router;
