import type { Request, Response } from "express";

import { BadRequestError, NotFoundError, UnauthorizedError } from "./errors.js";
import { getAPIKey } from "../auth.js";
import { config } from "../config.js";
import { upgradeUserToChirpyRed } from "../db/queries/users.js";

type PolkaWebhookBody = {
  event: string;
  data?: {
    userId?: string;
  };
};

export async function handlerPolkaWebhook(req: Request, res: Response) {
  const apiKey = getAPIKey(req);
  if (apiKey !== config.api.polkaKey) {
    throw new UnauthorizedError("Invalid API key");
  }

  const body = req.body as PolkaWebhookBody;

  if (body?.event !== "user.upgraded") {
    res.status(204).send();
    return;
  }

  const userId = body.data?.userId;
  if (!userId || typeof userId !== "string") {
    throw new BadRequestError("User ID is required");
  }

  const upgradedUser = await upgradeUserToChirpyRed(userId);
  if (!upgradedUser) {
    throw new NotFoundError("User not found");
  }

  res.status(204).send();
}
