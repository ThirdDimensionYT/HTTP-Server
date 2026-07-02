import type { Request, Response } from "express";

import { BadRequestError, UnauthorizedError } from "./errors.js";
import { respondWithJSON } from "./json.js";
import { checkPasswordHash, makeJWT, makeRefreshToken } from "../auth.js";
import { createRefreshToken } from "../db/queries/refreshTokens.js";
import { findUserByEmail } from "../db/queries/users.js";
import { config } from "../config.js";

type LoginBody = {
  email: string;
  password: string;
};

export async function handlerLogin(req: Request, res: Response) {
  const body = req.body as LoginBody;

  if (!body?.email || typeof body.email !== "string") {
    throw new BadRequestError("Email is required");
  }

  if (!body?.password || typeof body.password !== "string") {
    throw new BadRequestError("Password is required");
  }

  const user = await findUserByEmail(body.email);
  if (!user) {
    throw new UnauthorizedError("incorrect email or password");
  }

  const valid = await checkPasswordHash(body.password, user.hashedPassword);
  if (!valid) {
    throw new UnauthorizedError("incorrect email or password");
  }

  const token = makeJWT(user.id, 3600, config.auth.jwtSecret);
  const refreshToken = makeRefreshToken();
  const refreshTokenExpiresAt = new Date();
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 60);

  await createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: refreshTokenExpiresAt,
    revokedAt: null,
  });

  const { hashedPassword, ...userWithoutPassword } = user;

  respondWithJSON(res, 200, {
    ...userWithoutPassword,
    token,
    refreshToken,
  });
}
