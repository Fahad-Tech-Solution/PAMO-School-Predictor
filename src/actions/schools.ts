"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { createDb } from "@/db";
import { schools } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import {
  invalidateActiveSchoolsCache,
  invalidateDashboardCountsCache,
  invalidateSchoolStatsCache,
} from "@/lib/redis/cache";
import {
  getSchoolsByIds,
  listSchoolsForSelector,
  searchSchools,
  type SchoolSearchRow,
} from "@/lib/schools/queries";
import { schoolFormSchema } from "@/lib/validation/school";

export type SchoolActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  resetKey?: number;
};

const fail = (
  message: string,
  fieldErrors?: Record<string, string[]>,
): SchoolActionState => ({
  ok: false,
  message,
  fieldErrors,
});

async function assertUniqueNameState(
  name: string,
  state: string,
  excludeId?: string,
): Promise<string | null> {
  const db = createDb();
  const clauses = [
    sql`lower(${schools.name}) = lower(${name})`,
    eq(schools.state, state),
  ];
  if (excludeId) {
    clauses.push(ne(schools.id, excludeId));
  }

  const [existing] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(and(...clauses))
    .limit(1);

  if (existing) {
    return "A school with this name and state already exists.";
  }
  return null;
}

function parseForm(formData: FormData) {
  return schoolFormSchema.safeParse({
    name: formData.get("name"),
    state: formData.get("state"),
    requiresGre:
      formData.get("requiresGre") === "on" ||
      formData.get("requiresGre") === "true",
    isActive:
      formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
}

export async function createSchool(
  _prev: SchoolActionState,
  formData: FormData,
): Promise<SchoolActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return fail(
      "Please correct the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const db = createDb();

  try {
    // Single insert; uniqueness enforced by DB (skip pre-check round-trip).
    const [created] = await db
      .insert(schools)
      .values({
        name: parsed.data.name,
        state: parsed.data.state,
        requiresGre: parsed.data.requiresGre,
        isActive: parsed.data.isActive,
      })
      .returning();

    // Don't block the response on audit + cache revalidation.
    after(async () => {
      await writeAuditLog({
        userId: admin.id,
        action: "CREATE SCHOOL",
        entityType: "school",
        entityId: created.id,
        newValues: created,
      });
      await invalidateActiveSchoolsCache();
      await invalidateSchoolStatsCache(created.id);
      await invalidateDashboardCountsCache();
      revalidatePath("/schools");
      revalidatePath("/dashboard");
    });

    return {
      ok: true,
      message: `${created.name} was added successfully.`,
      resetKey: Date.now(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.toLowerCase().includes("unique") ||
      message.includes("schools_name_state") ||
      message.includes("duplicate")
    ) {
      return fail("A school with this name and state already exists.", {
        name: ["A school with this name and state already exists."],
      });
    }
    throw error;
  }
}

export async function updateSchool(
  schoolId: string,
  _prev: SchoolActionState,
  formData: FormData,
): Promise<SchoolActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(formData);

  if (!parsed.success) {
    return fail(
      "Please correct the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const db = createDb();
  const [existing] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  if (!existing) {
    return fail("School not found.");
  }

  const duplicate = await assertUniqueNameState(
    parsed.data.name,
    parsed.data.state,
    schoolId,
  );
  if (duplicate) {
    return fail(duplicate, { name: [duplicate] });
  }

  const [updated] = await db
    .update(schools)
    .set({
      name: parsed.data.name,
      state: parsed.data.state,
      requiresGre: parsed.data.requiresGre,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(schools.id, schoolId))
    .returning();

  after(async () => {
    await writeAuditLog({
      userId: admin.id,
      action: "UPDATE SCHOOL",
      entityType: "school",
      entityId: schoolId,
      oldValues: existing,
      newValues: updated,
    });
    await invalidateActiveSchoolsCache();
    await invalidateSchoolStatsCache(schoolId);
    await invalidateDashboardCountsCache();
    revalidatePath("/schools");
    revalidatePath(`/schools/${schoolId}`);
    revalidatePath("/dashboard");
  });

  return { ok: true, message: "School updated." };
}

export async function setSchoolActive(
  schoolId: string,
  isActive: boolean,
): Promise<SchoolActionState> {
  const admin = await requireAdmin();
  const db = createDb();

  const [existing] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  if (!existing) {
    return fail("School not found.");
  }

  const [updated] = await db
    .update(schools)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(schools.id, schoolId))
    .returning();

  after(async () => {
    await writeAuditLog({
      userId: admin.id,
      action: isActive ? "REACTIVATE SCHOOL" : "DEACTIVATE SCHOOL",
      entityType: "school",
      entityId: schoolId,
      oldValues: existing,
      newValues: updated,
    });
    await invalidateActiveSchoolsCache();
    await invalidateSchoolStatsCache(schoolId);
    await invalidateDashboardCountsCache();
    revalidatePath("/schools");
    revalidatePath(`/schools/${schoolId}`);
    revalidatePath("/dashboard");
  });

  return {
    ok: true,
    message: isActive ? "School reactivated." : "School deactivated.",
  };
}

export async function searchSchoolsAction(options: {
  query?: string;
  includeInactive?: boolean;
  limit?: number;
}): Promise<SchoolSearchRow[]> {
  await requireAuth();
  return searchSchools({
    q: options.query ?? "",
    activeOnly: !options.includeInactive,
    limit: options.limit ?? 12,
  });
}

/**
 * Full school catalog for typeahead (Redis when configured).
 * Client loads once, then filters locally — no per-keystroke DB.
 */
export async function listSchoolsCatalogAction(options?: {
  includeInactive?: boolean;
}): Promise<SchoolSearchRow[]> {
  await requireAuth();
  return listSchoolsForSelector({
    includeInactive: options?.includeInactive === true,
  });
}

/** @deprecated Prefer listSchoolsCatalogAction — kept for any residual callers. */
export async function listActiveSchoolsAction(): Promise<SchoolSearchRow[]> {
  return listSchoolsCatalogAction({ includeInactive: false });
}

/** Resolve selected school ids (including inactive) for selector labels. */
export async function getSchoolsByIdsAction(
  ids: string[],
): Promise<SchoolSearchRow[]> {
  await requireAuth();
  return getSchoolsByIds(ids);
}
