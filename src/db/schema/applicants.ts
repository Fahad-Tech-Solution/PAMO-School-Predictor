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
 * Anonymous applicant records.
 * Do NOT add name, email, phone, DOB, ethnicity, address, or student IDs.
 */
export const applicants = pgTable(
  "applicants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    homeState: text("home_state").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("applicants_home_state_idx").on(table.homeState),
    check(
      "applicants_home_state_not_empty",
      sql`length(trim(${table.homeState})) > 0`,
    ),
  ],
);

export type Applicant = typeof applicants.$inferSelect;
export type NewApplicant = typeof applicants.$inferInsert;
