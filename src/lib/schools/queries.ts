import "server-only";

import { and, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { cache } from "react";

import { createDb } from "@/db";
import { schools, type School } from "@/db/schema";
import {
  ACTIVE_SCHOOLS_TTL_SECONDS,
  CACHE_KEYS,
  cacheGet,
  cacheSet,
} from "@/lib/redis/cache";

export type SchoolListFilters = {
  q?: string;
  states?: string[];
  gre?: "all" | "required" | "not_required";
  status?: "active" | "inactive" | "all";
  page?: number;
  pageSize?: number;
};

export type SchoolListResult = {
  items: School[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildWhere(filters: SchoolListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  const status = filters.status ?? "active";
  if (status === "active") {
    clauses.push(eq(schools.isActive, true));
  } else if (status === "inactive") {
    clauses.push(eq(schools.isActive, false));
  }

  if (filters.states && filters.states.length > 0) {
    clauses.push(inArray(schools.state, filters.states));
  }

  if (filters.gre === "required") {
    clauses.push(eq(schools.requiresGre, true));
  } else if (filters.gre === "not_required") {
    clauses.push(eq(schools.requiresGre, false));
  }

  const q = filters.q?.trim();
  if (q) {
    clauses.push(ilike(schools.name, `%${q}%`));
  }

  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return and(...clauses);
}

export async function listSchools(
  filters: SchoolListFilters = {},
): Promise<SchoolListResult> {
  const db = createDb();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const where = buildWhere(filters);

  const [totalRow] = await db
    .select({ value: count() })
    .from(schools)
    .where(where);

  const total = Number(totalRow?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const items = await db
    .select()
    .from(schools)
    .where(where)
    .orderBy(schools.name)
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return { items, total, page: safePage, pageSize, totalPages };
}

export const getSchoolById = cache(async (id: string): Promise<School | null> => {
  const db = createDb();
  const [row] = await db.select().from(schools).where(eq(schools.id, id)).limit(1);
  return row ?? null;
});

export type SchoolSearchRow = {
  id: string;
  name: string;
  state: string;
  requiresGre: boolean;
  isActive: boolean;
};

export async function getSchoolsByIds(
  ids: string[],
): Promise<SchoolSearchRow[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];

  const db = createDb();
  return db
    .select({
      id: schools.id,
      name: schools.name,
      state: schools.state,
      requiresGre: schools.requiresGre,
      isActive: schools.isActive,
    })
    .from(schools)
    .where(inArray(schools.id, unique));
}

export async function searchSchools(options: {
  q: string;
  /** When true (default), only active schools. Set false to include inactive. */
  activeOnly?: boolean;
  limit?: number;
}): Promise<SchoolSearchRow[]> {
  const db = createDb();
  const q = options.q.trim();
  const limit = Math.min(500, Math.max(1, options.limit ?? 100));
  const clauses: SQL[] = [];

  if (options.activeOnly !== false) {
    clauses.push(eq(schools.isActive, true));
  }

  if (q) {
    clauses.push(
      or(ilike(schools.name, `%${q}%`), ilike(schools.state, `%${q}%`))!,
    );
  }

  const where =
    clauses.length === 0
      ? undefined
      : clauses.length === 1
        ? clauses[0]
        : and(...clauses);

  return db
    .select({
      id: schools.id,
      name: schools.name,
      state: schools.state,
      requiresGre: schools.requiresGre,
      isActive: schools.isActive,
    })
    .from(schools)
    .where(where)
    .orderBy(schools.name)
    .limit(limit);
}

export type ActiveSchoolSelectorRow = {
  id: string;
  name: string;
  state: string;
  requiresGre: boolean;
};

/** Full active school list for selector caching (id/name/state/GRE only). */
export async function listActiveSchoolsForSelector(): Promise<
  ActiveSchoolSelectorRow[]
> {
  const cached = await cacheGet<ActiveSchoolSelectorRow[]>(
    CACHE_KEYS.activeSchools,
  );
  if (cached) return cached;

  const db = createDb();
  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      state: schools.state,
      requiresGre: schools.requiresGre,
    })
    .from(schools)
    .where(eq(schools.isActive, true))
    .orderBy(schools.name);

  await cacheSet(CACHE_KEYS.activeSchools, rows, ACTIVE_SCHOOLS_TTL_SECONDS);
  return rows;
}

/**
 * Full school catalog for client-side typeahead (active, or active+inactive).
 * Cached in Redis when configured. Typing filters locally — no per-keystroke DB.
 */
export async function listSchoolsForSelector(options?: {
  includeInactive?: boolean;
}): Promise<SchoolSearchRow[]> {
  const includeInactive = options?.includeInactive === true;

  if (!includeInactive) {
    const rows = await listActiveSchoolsForSelector();
    return rows.map((row) => ({ ...row, isActive: true }));
  }

  const cached = await cacheGet<SchoolSearchRow[]>(CACHE_KEYS.allSchools);
  if (cached) return cached;

  const db = createDb();
  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      state: schools.state,
      requiresGre: schools.requiresGre,
      isActive: schools.isActive,
    })
    .from(schools)
    .orderBy(schools.name);

  await cacheSet(CACHE_KEYS.allSchools, rows, ACTIVE_SCHOOLS_TTL_SECONDS);
  return rows;
}
