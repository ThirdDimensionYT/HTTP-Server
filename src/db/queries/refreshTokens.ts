import { eq } from "drizzle-orm";

import { db } from "../index.js";
import { refreshTokens, users } from "../schema.js";
import type { NewRefreshToken } from "../schema.js";

export async function createRefreshToken(refreshToken: NewRefreshToken) {
  const [result] = await db.insert(refreshTokens).values(refreshToken).returning();
  return result;
}

export async function getRefreshTokenByToken(token: string) {
  const [result] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token));

  return result ?? null;
}

export async function getUserFromRefreshToken(token: string) {
  const [result] = await db
    .select({ user: users })
    .from(refreshTokens)
    .innerJoin(users, eq(refreshTokens.userId, users.id))
    .where(eq(refreshTokens.token, token));

  return result?.user ?? null;
}

export async function revokeRefreshToken(token: string, revokedAt: Date = new Date()) {
  const [result] = await db
    .update(refreshTokens)
    .set({ revokedAt, updatedAt: revokedAt })
    .where(eq(refreshTokens.token, token))
    .returning();

  return result ?? null;
}

export async function deleteAllRefreshTokens() {
  await db.delete(refreshTokens);
}
