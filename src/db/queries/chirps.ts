import { asc, desc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { NewChirp, chirps } from "../schema.js";

export type ChirpSortOrder = "asc" | "desc";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .returning();
  return result;
}

export async function getAllChirps(authorId?: string, sort: ChirpSortOrder = "asc") {
  const orderBy = sort === "desc" ? desc(chirps.createdAt) : asc(chirps.createdAt);

  if (authorId) {
    return await db
      .select()
      .from(chirps)
      .where(eq(chirps.userId, authorId))
      .orderBy(orderBy);
  }

  return await db.select().from(chirps).orderBy(orderBy);
}

export async function getChirpById(chirpId: string) {
  const [chirp] = await db
    .select()
    .from(chirps)
    .where(eq(chirps.id, chirpId));
  return chirp ?? null;
}

export async function deleteChirp(chirpId: string) {
  const [chirp] = await db
    .delete(chirps)
    .where(eq(chirps.id, chirpId))
    .returning();
  return chirp ?? null;
}
