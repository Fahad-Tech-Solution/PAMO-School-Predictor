/**
 * Import schools from public/data/wpfo_institutes.csv
 *
 * Mapping:
 * - institute_name → name
 * - state (full name) → US state code
 * - gre_status: "on" / "yes" / "true" → requiresGre true; empty otherwise
 * - isActive: always true
 *
 * Rows with unknown states are skipped and reported.
 *
 * Usage: npx tsx scripts/import-schools-from-csv.ts [--confirm]
 */
import { config } from "dotenv";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import { Redis } from "@upstash/redis";

import * as schema from "../src/db/schema";
import { schools } from "../src/db/schema";
import { US_STATES } from "../src/lib/geo/us-states";

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

const DEFAULT_CSV = resolve(
  process.cwd(),
  "public/data/wpfo_institutes.csv",
);

const STATE_BY_NAME = new Map(
  US_STATES.map((s) => [s.name.toLowerCase(), s.code]),
);

/** Common aliases / CSV quirks → US_STATES name. */
const STATE_ALIASES: Record<string, string> = {
  "washington dc": "District of Columbia",
  "washington, d.c.": "District of Columbia",
  "washington, dc": "District of Columbia",
  "d.c.": "District of Columbia",
  dc: "District of Columbia",
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]!;
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  return rows;
}

function resolveStateCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (US_STATES.some((s) => s.code === upper)) return upper;

  const alias = STATE_ALIASES[trimmed.toLowerCase()];
  const nameKey = (alias ?? trimmed).toLowerCase();
  return STATE_BY_NAME.get(nameKey) ?? null;
}

function parseGre(raw: string | undefined): boolean {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "on" || v === "yes" || v === "true" || v === "1";
}

type PlannedSchool = {
  name: string;
  state: string;
  requiresGre: boolean;
  isActive: true;
  line: number;
};

function loadPlans(csvPath: string): {
  plans: PlannedSchool[];
  skipped: Array<{ line: number; name: string; state: string; reason: string }>;
} {
  const text = readFileSync(csvPath, "utf8");
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error(`CSV has no data rows: ${csvPath}`);
  }

  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("institute_name");
  const stateIdx = header.indexOf("state");
  const greIdx = header.indexOf("gre_status");
  if (nameIdx < 0 || stateIdx < 0 || greIdx < 0) {
    throw new Error(
      `Expected columns institute_name,state,gre_status — got: ${header.join(",")}`,
    );
  }

  const plans: PlannedSchool[] = [];
  const skipped: Array<{
    line: number;
    name: string;
    state: string;
    reason: string;
  }> = [];
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i += 1) {
    const line = i + 1;
    const row = rows[i]!;
    const name = (row[nameIdx] ?? "").trim();
    const stateRaw = (row[stateIdx] ?? "").trim();
    const greRaw = row[greIdx] ?? "";

    if (!name) {
      skipped.push({ line, name, state: stateRaw, reason: "empty name" });
      continue;
    }
    if (name.length > 200) {
      skipped.push({ line, name, state: stateRaw, reason: "name too long" });
      continue;
    }

    const state = resolveStateCode(stateRaw);
    if (!state) {
      skipped.push({
        line,
        name,
        state: stateRaw,
        reason: `unknown state "${stateRaw}"`,
      });
      continue;
    }

    const key = `${name.toLowerCase()}|${state}`;
    if (seen.has(key)) {
      skipped.push({
        line,
        name,
        state: stateRaw,
        reason: "duplicate name+state in CSV",
      });
      continue;
    }
    seen.add(key);

    plans.push({
      name,
      state,
      requiresGre: parseGre(greRaw),
      isActive: true,
      line,
    });
  }

  return { plans, skipped };
}

async function main() {
  const confirmed = process.argv.includes("--confirm");
  const csvArg = process.argv.find((a) => a.endsWith(".csv"));
  const csvPath = csvArg ? resolve(process.cwd(), csvArg) : DEFAULT_CSV;

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is required in .env.local");

  const { plans, skipped } = loadPlans(csvPath);
  const greYes = plans.filter((p) => p.requiresGre).length;

  console.log(`CSV: ${csvPath}`);
  console.log(`Ready to insert: ${plans.length}`);
  console.log(`  GRE required: ${greYes}`);
  console.log(`  GRE not required: ${plans.length - greYes}`);
  console.log(`Skipped: ${skipped.length}`);
  for (const s of skipped) {
    console.log(`  line ${s.line}: ${s.name} (${s.state}) — ${s.reason}`);
  }

  if (!confirmed) {
    console.log("Dry run only. Re-run with --confirm to insert.");
    return;
  }

  const client = postgres(dbUrl, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  try {
    const [[before]] = await Promise.all([
      db.select({ value: count() }).from(schools),
    ]);
    console.log(`Schools before insert: ${Number(before?.value ?? 0)}`);

    const chunkSize = 50;
    let inserted = 0;
    for (let i = 0; i < plans.length; i += chunkSize) {
      const chunk = plans.slice(i, i + chunkSize).map((p) => ({
        name: p.name,
        state: p.state,
        requiresGre: p.requiresGre,
        isActive: true as const,
      }));
      await db.insert(schools).values(chunk);
      inserted += chunk.length;
      console.log(`  inserted ${inserted}/${plans.length}`);
    }

    const [after] = await db.select({ value: count() }).from(schools);
    console.log(`Schools after insert: ${Number(after?.value ?? 0)}`);
    await clearSchoolCaches();
    console.log("Done.");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
