import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;

const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;

async function main() {
  if (!url || !dbUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or DATABASE_URL");
  }

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD are required (no defaults). Set them in .env.local.",
    );
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error(
      "ADMIN_PASSWORD must include at least one letter and one number.",
    );
  }

  const sql = postgres(dbUrl, { prepare: false, max: 1 });

  try {
    let userId: string | null = null;

    if (serviceRole) {
      const admin = createClient(url, serviceRole, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (created.error) {
        const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = list.data.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );
        if (!existing) {
          throw new Error(
            `Admin create failed: ${created.error.message}. Could not find existing user.`,
          );
        }
        userId = existing.id;
        const updated = await admin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
        });
        if (updated.error) {
          throw new Error(`Password update failed: ${updated.error.message}`);
        }
        console.log("Auth user already existed; password updated.");
      } else {
        userId = created.data.user.id;
        console.log("Auth user created via service role.");
      }
    } else {
      if (!anon) {
        throw new Error(
          "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or set SUPABASE_SERVICE_ROLE_KEY)",
        );
      }

      const supabase = createClient(url, anon);
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        const signIn = await supabase.auth.signInWithPassword({ email, password });
        if (signIn.error || !signIn.data.user) {
          throw new Error(
            `Auth create/sign-in failed: ${error.message} | ${signIn.error?.message ?? "no user"}. Add SUPABASE_SERVICE_ROLE_KEY to .env.local if public signup is disabled.`,
          );
        }
        userId = signIn.data.user.id;
        console.log("Auth user already existed; signed in successfully.");
      } else if (!data.user) {
        throw new Error("Sign-up returned no user id");
      } else {
        userId = data.user.id;
        console.log("Auth user created via signUp.");
      }
    }

    if (!userId) {
      throw new Error("No auth user id resolved");
    }

    await sql`
      update auth.users
      set
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
      where id = ${userId}
    `;
    console.log("Auth email marked confirmed.");

    const existing = await sql<
      { id: string; email: string; role: string; is_active: boolean }[]
    >`
      select id, email, role, is_active
      from public.users
      where id = ${userId} or email = ${email}
    `;

    if (existing.length > 0) {
      await sql`
        update public.users
        set
          id = ${userId},
          email = ${email},
          name = 'Admin User',
          role = 'ADMIN',
          is_active = true,
          updated_at = now()
        where id = ${existing[0].id}
      `;
      console.log("public.users updated as ADMIN.");
    } else {
      await sql`
        insert into public.users (id, email, name, role, is_active)
        values (${userId}, ${email}, 'Admin User', 'ADMIN', true)
      `;
      console.log("public.users inserted as ADMIN.");
    }

    const verify = await sql<
      { id: string; email: string; role: string; is_active: boolean }[]
    >`
      select id, email, role, is_active
      from public.users
      where email = ${email}
    `;

    console.log(
      "Verified:",
      JSON.stringify({
        id: verify[0]?.id,
        email: verify[0]?.email,
        role: verify[0]?.role,
        is_active: verify[0]?.is_active,
      }),
    );
    console.log("DONE");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
