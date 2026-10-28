/**
 * Wipe admissions data so the school catalog can be replaced cleanly.
 * Order: applications → applicants → schools.
 * Does NOT touch users or audit_logs.
 *
 * Usage: npx tsx scripts/wipe-admissions-data.ts
 * Requires DATABASE_URL in .env.local
 *
 * Pass --confirm to actually delete (safety gate).
 */
import { config } from "dotenv";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Redis } from "@upstash/redis";

import * as schema from "../src/db/schema";
import { applicants, applications, schools } from "../src/db/schema";

config({ path: ".env.local" });

const SCHOOL_CATALOG_CACHE_KEYS = [
  "pamo:cache:schools:active:v1",
  "pamo:cache:schools:all:v1",
  "pamo:cache:dashboard:counts:v2",
  "pamo:cache:dashboard:recent-apps:v1",
  "pamo:cache:dashboard:recent-schools:v1",
];

async function clearSchoolCaches() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    console.log("Redis not configured — skipping cache clear.");
    return;
  }
  const redis = new Redis({ url, token });
  await redis.del(...SCHOOL_CATALOG_CACHE_KEYS);
  console.log("Cleared school/dashboard Redis caches.");
}

async function main() {
  const confirmed = process.argv.includes("--confirm");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required in .env.local");
  }

  const client = postgres(dbUrl, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  try {
    const [[appRow], [applicantRow], [schoolRow]] = await Promise.all([
      db.select({ value: count() }).from(applications),
      db.select({ value: count() }).from(applicants),
      db.select({ value: count() }).from(schools),
    ]);

    const before = {
      applications: Number(appRow?.value ?? 0),
      applicants: Number(applicantRow?.value ?? 0),
      schools: Number(schoolRow?.value ?? 0),
    };

    console.log("Current counts:", before);

    if (!confirmed) {
      console.log(
        "Dry run only. Re-run with --confirm to delete applications → applicants → schools.",
      );
      return;
    }

    console.log("Deleting applications…");
    await db.delete(applications);
    console.log("Deleting applicants…");
    await db.delete(applicants);
    console.log("Deleting schools…");
    await db.delete(schools);

    const [[a2], [p2], [s2]] = await Promise.all([
      db.select({ value: count() }).from(applications),
      db.select({ value: count() }).from(applicants),
      db.select({ value: count() }).from(schools),
    ]);

    console.log("After wipe:", {
      applications: Number(a2?.value ?? 0),
      applicants: Number(p2?.value ?? 0),
      schools: Number(s2?.value ?? 0),
    });
    await clearSchoolCaches();
    console.log("Done. Users and audit_logs were left intact.");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
