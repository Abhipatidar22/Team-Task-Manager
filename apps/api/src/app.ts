import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import fs from "fs";
import path from "path";
import apiRouter from "./routes";
import { errorHandler, notFound } from "./utils/http";

const app = express();

app.use(helmet());
app.use(compression());

app.use(express.json({
  limit: "1mb",
}));

app.use(cors({
  origin: true,
  credentials: true,
}));

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// API routes
app.use("/api", apiRouter);

// Frontend serving
const webDistPath = path.resolve(
  process.cwd(),
  "../web/dist"
);

console.log("Frontend path:", webDistPath);
console.log("Frontend exists:", fs.existsSync(webDistPath));

if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));

  app.get("/", (_req, res) => {
    res.sendFile(path.join(webDistPath, "index.html"));
  });

  app.use((_req, res) => {
    res.sendFile(path.join(webDistPath, "index.html"));
  });
}

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;