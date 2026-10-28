CREATE INDEX IF NOT EXISTS "applications_created_at_idx" ON "applications" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_school_status_created_idx" ON "applications" ("school_id","status","created_at");
