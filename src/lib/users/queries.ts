import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { createDb } from "@/db";
import { users, type User } from "@/db/schema";

export async function listUsers(): Promise<User[]> {
  const db = createDb();
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: string): Promise<User | null> {
  const db = createDb();
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = createDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}

export async function countActiveAdmins(excludeUserId?: string): Promise<number> {
  const db = createDb();
  const clauses = [
    eq(users.role, "ADMIN"),
    eq(users.isActive, true),
  ];
  // exclude handled in caller for simplicity when checking last admin
  const [row] = await db
    .select({ value: count() })
    .from(users)
    .where(and(...clauses));

  const total = Number(row?.value ?? 0);
  if (!excludeUserId) return total;

  const [excluded] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, excludeUserId),
        eq(users.role, "ADMIN"),
        eq(users.isActive, true),
      ),
    )
    .limit(1);

  return excluded ? Math.max(0, total - 1) : total;
}
