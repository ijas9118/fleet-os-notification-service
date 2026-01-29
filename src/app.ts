import type { Application, NextFunction, Request, Response } from "express";

import { STATUS_CODES } from "@ahammedijas/fleet-os-shared";
import express from "express";
import helmet from "helmet";

import logger from "./config/logger";

export default function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(express.json());

  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });

  app.get("/healthz", (_req: Request, res: Response) => {
    res.status(STATUS_CODES.OK).json({ status: "ok" });
  });

  return app;
}
