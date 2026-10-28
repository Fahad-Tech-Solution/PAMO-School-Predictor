CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('ACCEPTED', 'NOT_ACCEPTED', 'WAITLISTED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" "user_role" DEFAULT 'VIEWER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"requires_gre" boolean NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schools_name_not_empty" CHECK (length(trim("schools"."name")) > 0),
	CONSTRAINT "schools_state_not_empty" CHECK (length(trim("schools"."state")) > 0)
);
--> statement-breakpoint
CREATE TABLE "applicants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applicants_home_state_not_empty" CHECK (length(trim("applicants"."home_state")) > 0)
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"bcp_gpa" numeric(3, 2),
	"overall_gpa" numeric(3, 2),
	"science_gpa" numeric(3, 2),
	"pce_hours" integer,
	"application_attempt" integer DEFAULT 1 NOT NULL,
	"status" "application_status",
	"waitlisted_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_bcp_gpa_range" CHECK ("applications"."bcp_gpa" IS NULL OR ("applications"."bcp_gpa" >= 2.70 AND "applications"."bcp_gpa" <= 4.00)),
	CONSTRAINT "applications_overall_gpa_range" CHECK ("applications"."overall_gpa" IS NULL OR ("applications"."overall_gpa" >= 2.70 AND "applications"."overall_gpa" <= 4.00)),
	CONSTRAINT "applications_science_gpa_range" CHECK ("applications"."science_gpa" IS NULL OR ("applications"."science_gpa" >= 2.70 AND "applications"."science_gpa" <= 4.00)),
	CONSTRAINT "applications_pce_hours_nonnegative" CHECK ("applications"."pce_hours" IS NULL OR "applications"."pce_hours" >= 0),
	CONSTRAINT "applications_attempt_positive" CHECK ("applications"."application_attempt" >= 1)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "schools_name_state_uidx" ON "schools" USING btree ("name","state");--> statement-breakpoint
CREATE INDEX "schools_name_idx" ON "schools" USING btree ("name");--> statement-breakpoint
CREATE INDEX "schools_state_idx" ON "schools" USING btree ("state");--> statement-breakpoint
CREATE INDEX "schools_requires_gre_idx" ON "schools" USING btree ("requires_gre");--> statement-breakpoint
CREATE INDEX "schools_is_active_idx" ON "schools" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "applicants_home_state_idx" ON "applicants" USING btree ("home_state");--> statement-breakpoint
CREATE INDEX "applications_school_id_idx" ON "applications" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "applications_applicant_id_idx" ON "applications" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_attempt_idx" ON "applications" USING btree ("application_attempt");--> statement-breakpoint
CREATE INDEX "applications_overall_gpa_idx" ON "applications" USING btree ("overall_gpa");--> statement-breakpoint
CREATE INDEX "applications_science_gpa_idx" ON "applications" USING btree ("science_gpa");--> statement-breakpoint
CREATE INDEX "applications_bcp_gpa_idx" ON "applications" USING btree ("bcp_gpa");--> statement-breakpoint
CREATE INDEX "applications_pce_hours_idx" ON "applications" USING btree ("pce_hours");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");