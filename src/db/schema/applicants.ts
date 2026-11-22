import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Applicant records.
 * lastName/firstName are for admin lookup/edit only — never use in school
 * statistics charts or predictor similarity features.
 * Do NOT add email, phone, DOB, ethnicity, address, or student IDs.
 */
export const applicants = pgTable(
  "applicants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    homeState: text("home_state").notNull(),
    /** Admin lookup only. Null for legacy anonymous rows. */
    lastName: text("last_name"),
    /** Admin lookup only. Null for legacy anonymous rows. */
    firstName: text("first_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("applicants_home_state_idx").on(table.homeState),
    index("applicants_last_name_idx").on(table.lastName),
    check(
      "applicants_home_state_not_empty",
      sql`length(trim(${table.homeState})) > 0`,
    ),
  ],
);

export type Applicant = typeof applicants.$inferSelect;
export type NewApplicant = typeof applicants.$inferInsert;
