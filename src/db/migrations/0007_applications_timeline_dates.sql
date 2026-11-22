ALTER TABLE "applications" ADD COLUMN "interview_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "results_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "applications_interview_at_idx" ON "applications" USING btree ("interview_at");--> statement-breakpoint
CREATE INDEX "applications_results_at_idx" ON "applications" USING btree ("results_at");--> statement-breakpoint
CREATE INDEX "applications_school_interview_idx" ON "applications" USING btree ("school_id","interview_at");--> statement-breakpoint
CREATE INDEX "applications_school_results_idx" ON "applications" USING btree ("school_id","results_at");
