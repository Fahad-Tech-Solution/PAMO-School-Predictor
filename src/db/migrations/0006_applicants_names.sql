ALTER TABLE "applicants" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "first_name" text;--> statement-breakpoint
CREATE INDEX "applicants_last_name_idx" ON "applicants" USING btree ("last_name");
