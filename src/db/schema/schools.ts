import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const schools = pgTable(
  "schools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    state: text("state").notNull(),
    requiresGre: boolean("requires_gre").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("schools_name_state_uidx").on(table.name, table.state),
    index("schools_name_idx").on(table.name),
    index("schools_state_idx").on(table.state),
    index("schools_requires_gre_idx").on(table.requiresGre),
    index("schools_is_active_idx").on(table.isActive),
    check("schools_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("schools_state_not_empty", sql`length(trim(${table.state})) > 0`),
  ],
);

export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
