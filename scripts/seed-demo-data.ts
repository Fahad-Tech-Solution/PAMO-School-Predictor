/**
 * Seed 50 demo schools + 50 applications (with anonymous applicants).
 * Idempotent for schools: skips name+state pairs that already exist.
 *
 * Usage: npm run db:seed-demo
 */
import { config } from "dotenv";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/db/schema";
import { applicants, applications, schools } from "../src/db/schema";

config({ path: ".env.local" });

const STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI",
] as const;

const SCHOOL_PREFIXES = [
  "University of",
  "State University of",
  "College of",
  "Metropolitan",
  "Coastal",
  "Midwest",
  "Pacific",
  "Great Lakes",
  "Summit",
  "Harbor",
] as const;

const SCHOOL_SUFFIXES = [
  "PA Program",
  "Physician Assistant Studies",
  "Health Sciences PA",
  "Medical Sciences PA",
  "Allied Health PA",
] as const;

type AppStatus = "ACCEPTED" | "NOT_ACCEPTED" | "WAITLISTED" | null;

function gpa(seed: number): string {
  // 2.70 – 4.00
  const value = 2.7 + ((seed * 37) % 131) / 100;
  return Math.min(4, Math.max(2.7, value)).toFixed(2);
}

function pce(seed: number): number {
  const bands = [200, 600, 1200, 1800, 2500, 3200, 4500, 5500, 7200, 8500, 11000];
  return bands[seed % bands.length]!;
}

function statusFor(seed: number): AppStatus {
  const roll = seed % 10;
  if (roll < 3) return "ACCEPTED";
  if (roll < 6) return "NOT_ACCEPTED";
  if (roll < 8) return "WAITLISTED";
  return null;
}

function attemptFor(seed: number): number {
  return (seed % 6) + 1;
}

function buildSchoolPlan(): Array<{
  name: string;
  state: string;
  requiresGre: boolean;
  isActive: boolean;
}> {
  const plans: Array<{
    name: string;
    state: string;
    requiresGre: boolean;
    isActive: boolean;
  }> = [];
  const used = new Set<string>();

  for (let i = 0; i < 50; i += 1) {
    const state = STATE_CODES[i % STATE_CODES.length]!;
    const prefix = SCHOOL_PREFIXES[i % SCHOOL_PREFIXES.length]!;
    const suffix = SCHOOL_SUFFIXES[i % SCHOOL_SUFFIXES.length]!;
    // Unique per (name, state): include index in name.
    const name = `${prefix} ${state} Demo ${String(i + 1).padStart(2, "0")} ${suffix}`;
    const key = `${name.toLowerCase()}|${state}`;
    if (used.has(key)) continue;
    used.add(key);
    plans.push({
      name,
      state,
      requiresGre: i % 3 !== 0,
      isActive: i >= 47 ? false : true, // last 3 inactive for historical testing
    });
  }

  return plans;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required in .env.local");
  }

  const client = postgres(dbUrl, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  try {
    const plans = buildSchoolPlan();
    const insertedSchools: Array<{ id: string; state: string }> = [];

    console.log("Seeding schools…");
    for (const plan of plans) {
      const [existing] = await db
        .select({ id: schools.id, state: schools.state })
        .from(schools)
        .where(and(eq(schools.name, plan.name), eq(schools.state, plan.state)))
        .limit(1);

      if (existing) {
        insertedSchools.push(existing);
        continue;
      }

      const [created] = await db
        .insert(schools)
        .values({
          name: plan.name,
          state: plan.state,
          requiresGre: plan.requiresGre,
          isActive: plan.isActive,
        })
        .returning({ id: schools.id, state: schools.state });

      insertedSchools.push(created);
    }

    console.log(`Schools ready: ${insertedSchools.length}`);

    // Avoid duplicating demo applications if script is re-run.
    const [{ count: demoAppCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applications)
      .innerJoin(schools, eq(applications.schoolId, schools.id))
      .where(sql`${schools.name} like '% Demo %'`);

    if (Number(demoAppCount) >= 50) {
      console.log(
        `Demo applications already present (${demoAppCount}). Skipping application seed.`,
      );
      return;
    }

    console.log("Seeding applicants + applications…");
    const appRows: Array<typeof applications.$inferInsert> = [];
    const now = Date.now();

    // ~35 applicants; some with multiple apps → 50 applications total.
    for (let i = 0; i < 50; i += 1) {
      const school = insertedSchools[i % insertedSchools.length]!;
      // Reuse applicant every other app so some have 2 applications.
      const reusePrevious = i > 0 && i % 3 === 0;
      let applicantId: string;

      if (reusePrevious && appRows.length > 0) {
        applicantId = appRows[appRows.length - 1]!.applicantId as string;
      } else {
        const homeState =
          i % 4 === 0
            ? school.state // in-state
            : STATE_CODES[(i * 7) % STATE_CODES.length]!;
        const [applicant] = await db
          .insert(applicants)
          .values({ homeState })
          .returning({ id: applicants.id });
        applicantId = applicant.id;
      }

      const status = statusFor(i);
      const waitlistedAt =
        status === "WAITLISTED" || status === "ACCEPTED"
          ? new Date(now - (i + 10) * 86_400_000)
          : null;
      const acceptedAt =
        status === "ACCEPTED" ? new Date(now - i * 86_400_000) : null;

      appRows.push({
        applicantId,
        schoolId: school.id,
        bcpGpa: gpa(i),
        overallGpa: gpa(i + 3),
        scienceGpa: gpa(i + 7),
        pceHours: pce(i),
        applicationAttempt: attemptFor(i),
        status,
        waitlistedAt,
        acceptedAt,
      });
    }

    // Insert in batches
    const batchSize = 25;
    let created = 0;
    for (let i = 0; i < appRows.length; i += batchSize) {
      const batch = appRows.slice(i, i + batchSize);
      await db.insert(applications).values(batch);
      created += batch.length;
    }

    console.log(`Applications created: ${created}`);
    console.log("DONE");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
