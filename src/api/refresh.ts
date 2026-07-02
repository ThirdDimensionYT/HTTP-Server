import type { Request, Response } from "express";

import { getBearerToken, makeJWT } from "../auth.js";
import { config } from "../config.js";
import {
  getRefreshTokenByToken,
  getUserFromRefreshToken,
  revokeRefreshToken,
} from "../db/queries/refreshTokens.js";
import { UnauthorizedError } from "./errors.js";
import { respondWithJSON } from "./json.js";

export async function handlerRefresh(req: Request, res: Response) {
  const refreshToken = getBearerToken(req);

  const tokenRecord = await getRefreshTokenByToken(refreshToken);
  if (!tokenRecord) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (tokenRecord.revokedAt) {
    throw new UnauthorizedError("Refresh token has been revoked");
  }

  const now = new Date();
  if (tokenRecord.expiresAt <= now) {
    throw new UnauthorizedError("Refresh token expired");
  }

  const user = await getUserFromRefreshToken(refreshToken);
  if (!user) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const token = makeJWT(user.id, 3600, config.auth.jwtSecret);

  respondWithJSON(res, 200, { token });
}

export async function handlerRevoke(req: Request, res: Response) {
  const refreshToken = getBearerToken(req);

  const tokenRecord = await getRefreshTokenByToken(refreshToken);
  if (!tokenRecord) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  await revokeRefreshToken(refreshToken);
  res.status(204).send();
}
