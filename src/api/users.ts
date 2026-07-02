import type { Request, Response } from "express";

import { BadRequestError } from "./errors.js";
import { respondWithJSON } from "./json.js";
import { getBearerToken, hashPassword, validateJWT } from "../auth.js";
import { config } from "../config.js";
import { createUser, updateUser } from "../db/queries/users.js";

type CreateUserBody = {
  email: string;
  password: string;
};

export type UserResponse = Omit<
  Awaited<ReturnType<typeof createUser>>,
  "hashedPassword"
>;

export async function handlerCreateUser(req: Request, res: Response) {
  const body = req.body as CreateUserBody;

  if (!body?.email || typeof body.email !== "string") {
    throw new BadRequestError("Email is required");
  }

  if (!body?.password || typeof body.password !== "string") {
    throw new BadRequestError("Password is required");
  }

  const hashedPassword = await hashPassword(body.password);
  const createdUser = await createUser({
    email: body.email,
    hashedPassword,
  });

  if (!createdUser) {
    throw new BadRequestError("Unable to create user");
  }

  const { hashedPassword: _hashedPassword, ...userWithoutPassword } = createdUser;
  respondWithJSON(res, 201, userWithoutPassword);
}

export async function handlerUpdateUser(req: Request, res: Response) {
  const token = getBearerToken(req);
  const userId = validateJWT(token, config.auth.jwtSecret);
  const body = req.body as CreateUserBody;

  if (!body?.email || typeof body.email !== "string") {
    throw new BadRequestError("Email is required");
  }

  if (!body?.password || typeof body.password !== "string") {
    throw new BadRequestError("Password is required");
  }

  const hashedPassword = await hashPassword(body.password);
  const updatedUser = await updateUser(userId, {
    email: body.email,
    hashedPassword,
  });

  if (!updatedUser) {
    throw new BadRequestError("Unable to update user");
  }

  const { hashedPassword: _hashedPassword, ...userWithoutPassword } = updatedUser;
  respondWithJSON(res, 200, userWithoutPassword);
}
