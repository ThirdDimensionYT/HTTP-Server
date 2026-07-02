import { db } from "../index.js";
import { eq } from "drizzle-orm";
import { users } from "../schema.js";
import type { NewUser } from "../schema.js";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
}

export async function updateUser(
  id: string,
  user: Pick<NewUser, "email" | "hashedPassword">,
) {
  const [result] = await db
    .update(users)
    .set(user)
    .where(eq(users.id, id))
    .returning();
  return result ?? null;
}

export async function upgradeUserToChirpyRed(id: string) {
  const [result] = await db
    .update(users)
    .set({ isChirpyRed: true })
    .where(eq(users.id, id))
    .returning();
  return result ?? null;
}

export async function deleteAllUsers() {
  await db.delete(users);
}
