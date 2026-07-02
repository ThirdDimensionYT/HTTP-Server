import type { Request, Response } from "express";
import { config } from "../config.js";
import { deleteAllUsers } from "../db/queries/users.js";

export async function handlerReset(_req: Request, res: Response) {
  if (config.api.platform !== "dev") {
    res.status(403).set("Content-Type", "text/plain; charset=utf-8");
    res.send("Forbidden");
    return;
  }

  await deleteAllUsers();
  config.api.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("Hits reset");
}
