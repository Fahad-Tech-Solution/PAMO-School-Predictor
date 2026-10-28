import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { applicants } from "@/db/schema/applicants";
import { schools } from "@/db/schema/schools";

/**
 * Status may be NULL when ultimate outcome is unknown.
 * NULL must NOT be treated as NOT_ACCEPTED.
 */
export const applicationStatusEnum = pgEnum("application_status", [
  "ACCEPTED",
  "NOT_ACCEPTED",
  "WAITLISTED",
]);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => applicants.id, { onDelete: "restrict" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),

    bcpGpa: numeric("bcp_gpa", { precision: 3, scale: 2 }),
    overallGpa: numeric("overall_gpa", { precision: 3, scale: 2 }),
    scienceGpa: numeric("science_gpa", { precision: 3, scale: 2 }),

    pceHours: integer("pce_hours"),

    applicationAttempt: integer("application_attempt").notNull().default(1),

    status: applicationStatusEnum("status"),

    waitlistedAt: timestamp("waitlisted_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("applications_school_id_idx").on(table.schoolId),
    index("applications_applicant_id_idx").on(table.applicantId),
    index("applications_status_idx").on(table.status),
    index("applications_attempt_idx").on(table.applicationAttempt),
    index("applications_overall_gpa_idx").on(table.overallGpa),
    index("applications_science_gpa_idx").on(table.scienceGpa),
    index("applications_bcp_gpa_idx").on(table.bcpGpa),
    index("applications_pce_hours_idx").on(table.pceHours),
    index("applications_created_at_idx").on(table.createdAt),
    index("applications_school_status_created_idx").on(
      table.schoolId,
      table.status,
      table.createdAt,
    ),
    check(
      "applications_bcp_gpa_range",
      sql`${table.bcpGpa} IS NULL OR (${table.bcpGpa} >= 2.70 AND ${table.bcpGpa} <= 4.00)`,
    ),
    check(
      "applications_overall_gpa_range",
      sql`${table.overallGpa} IS NULL OR (${table.overallGpa} >= 2.70 AND ${table.overallGpa} <= 4.00)`,
    ),
    check(
      "applications_science_gpa_range",
      sql`${table.scienceGpa} IS NULL OR (${table.scienceGpa} >= 2.70 AND ${table.scienceGpa} <= 4.00)`,
    ),
    check(
      "applications_pce_hours_nonnegative",
      sql`${table.pceHours} IS NULL OR ${table.pceHours} >= 0`,
    ),
    check(
      "applications_attempt_positive",
      sql`${table.applicationAttempt} >= 1`,
    ),
  ],
);

export const applicationsRelations = relations(applications, ({ one }) => ({
  applicant: one(applicants, {
    fields: [applications.applicantId],
    references: [applicants.id],
  }),
  school: one(schools, {
    fields: [applications.schoolId],
    references: [schools.id],
  }),
}));

export const applicantsRelations = relations(applicants, ({ many }) => ({
  applications: many(applications),
}));

export const schoolsRelations = relations(schools, ({ many }) => ({
  applications: many(applications),
}));

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
