import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const db = createDb();
  const [row] = await db
    .select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, data.user.id))
    .limit(1);

  if (!row || !row.isActive) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_provisioned`);
  }

  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
