/**
 * Verify school rows + clear school catalog Redis caches.
 * Usage: npx tsx scripts/check-schools-and-clear-cache.ts
 */
import { config } from "dotenv";
import { count, eq, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Redis } from "@upstash/redis";

import * as schema from "../src/db/schema";
import { schools } from "../src/db/schema";

config({ path: ".env.local" });

const CACHE_KEYS = [
  "pamo:cache:schools:active:v1",
  "pamo:cache:schools:all:v1",
  "pamo:cache:dashboard:counts:v2",
  "pamo:cache:dashboard:recent-apps:v1",
  "pamo:cache:dashboard:recent-schools:v1",
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL required");

  const client = postgres(dbUrl, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  try {
    const [total] = await db.select({ value: count() }).from(schools);
    const [active] = await db
      .select({ value: count() })
      .from(schools)
      .where(eq(schools.isActive, true));
    const samples = await db
      .select({ name: schools.name, state: schools.state })
      .from(schools)
      .orderBy(schools.name)
      .limit(8);
    const demos = await db
      .select({ name: schools.name })
      .from(schools)
      .where(ilike(schools.name, "%Demo%"))
      .limit(5);

    console.log("DB schools total:", Number(total?.value ?? 0));
    console.log("DB schools active:", Number(active?.value ?? 0));
    console.log("Sample names:", samples);
    console.log("Demo-named rows:", demos.length, demos);

    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) {
      console.log("Redis not configured — no cache to clear.");
      return;
    }

    const redis = new Redis({ url, token });
    const result = await redis.del(...CACHE_KEYS);
    console.log("Cleared Redis keys:", CACHE_KEYS.join(", "));
    console.log("del result:", result);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
