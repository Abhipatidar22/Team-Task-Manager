import { Router } from "express";
import authRouter from "./auth";
import projectsRouter from "./projects";
import dashboardRouter from "./dashboard";

const router = Router();

router.use("/auth", authRouter);
router.use("/projects", projectsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
