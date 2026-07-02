import crypto from "node:crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request } from "express";
import { UnauthorizedError } from "./api/errors.js";

type TokenPayload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(
  password: string,
  hash: string,
): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    iss: "chirpy",
    sub: userID,
    iat,
    exp: iat + expiresIn,
  };

  return jwt.sign(payload, secret);
}

export function makeRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateJWT(tokenString: string, secret: string): string {
  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(tokenString, secret) as JwtPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  if (!decoded || typeof decoded !== "object") {
    throw new UnauthorizedError("Invalid token");
  }

  if (decoded.iss !== "chirpy") {
    throw new UnauthorizedError("Invalid token issuer");
  }

  if (!decoded.sub || typeof decoded.sub !== "string") {
    throw new UnauthorizedError("Invalid token payload");
  }

  return decoded.sub;
}

export function getBearerToken(req: Request): string {
  const authorization = req.get("Authorization");

  if (!authorization) {
    throw new UnauthorizedError("Authorization header is required");
  }

  const parts = authorization.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new UnauthorizedError("Invalid authorization header format");
  }

  const token = parts[1].trim();
  if (!token) {
    throw new UnauthorizedError("Bearer token is missing");
  }

  return token;
}

export function getAPIKey(req: Request): string {
  const authorization = req.get("Authorization");

  if (!authorization) {
    throw new UnauthorizedError("Authorization header is required");
  }

  const parts = authorization.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0] !== "ApiKey") {
    throw new UnauthorizedError("Invalid authorization header format");
  }

  const apiKey = parts[1].trim();
  if (!apiKey) {
    throw new UnauthorizedError("API key is missing");
  }

  return apiKey;
}
