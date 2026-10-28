import "server-only";

import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import type { AppUser } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

function toAppUser(row: typeof users.$inferSelect): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.isActive,
  };
}

/**
 * Resolve the signed-in Auth user against an active public.users row.
 * Never auto-provisions public.users.
 *
 * Uses getUser() so the JWT is validated with Supabase Auth (not cookie-only).
 */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  await connection();

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const db = createDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!row || !row.isActive) {
    // Auth session exists but app access is not provisioned / inactive.
    await supabase.auth.signOut();
    return null;
  }

  return toAppUser(row);
});

export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    redirect("/forbidden");
  }
  return user;
}
