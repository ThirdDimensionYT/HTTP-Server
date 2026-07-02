import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { HttpError } from "./errors.js";

export function middlewareCountFileServerHits(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  config.api.fileserverHits += 1;
  next();
}

export function middlewareLogResponse(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("finish", () => {
    const statusCode = res.statusCode;

    if (statusCode >= 300) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
    }
  });

  next();
}

export function middlewareHandleErrors(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.log(err);
  res.status(500).json({ error: "Something went wrong on our end" });
}
