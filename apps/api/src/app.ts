import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import apiRouter from "./routes";
import { env } from "./env";
import { errorHandler, notFound } from "./utils/http";

const app = express();

app.use(express.json());

if (env.CORS_ORIGIN) {
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", apiRouter);

const webDistPath = path.resolve(__dirname, "../../web/dist");
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(webDistPath, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
