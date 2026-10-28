import { sql } from "drizzle-orm";

import { createDb } from "@/db";
import { hasRequiredEnv } from "@/lib/env";

export type DbConnectionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

type CheckOptions = {
  /** When true (CLI only), include underlying error text. Never enable for HTTP. */
  includeErrorDetails?: boolean;
};

/**
 * Minimal connectivity check: Next.js → Drizzle → PostgreSQL/Supabase.
 * Does not insert or modify any data.
 */
export async function checkDatabaseConnection(
  options: CheckOptions = {},
): Promise<DbConnectionResult> {
  if (!hasRequiredEnv()) {
    return {
      ok: false,
      message: options.includeErrorDetails
        ? "Missing environment variables. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and DATABASE_URL in .env.local."
        : "Database is not configured.",
    };
  }

  try {
    const db = createDb();
    const result = await db.execute(sql`select 1 as connected`);
    const row = result[0] as { connected?: number } | undefined;

    if (row?.connected === 1) {
      return {
        ok: true,
        message: "PostgreSQL connection through Drizzle verified.",
      };
    }

    return {
      ok: false,
      message: "Database connectivity check returned unexpected data.",
    };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown database connection error.";
    console.error("[db-check]", detail);

    return {
      ok: false,
      message: options.includeErrorDetails
        ? detail
        : "Database connection failed.",
    };
  }
}
