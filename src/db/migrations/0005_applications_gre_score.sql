ALTER TABLE "applications" ADD COLUMN "gre_score" integer;--> statement-breakpoint
CREATE INDEX "applications_gre_score_idx" ON "applications" USING btree ("gre_score");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_gre_score_range" CHECK ("gre_score" IS NULL OR ("gre_score" >= 270 AND "gre_score" <= 330));
