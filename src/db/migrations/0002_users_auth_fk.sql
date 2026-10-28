-- Align public.users with Supabase Auth identity.
-- public.users.id must equal auth.users.id (no independent user IDs).

ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_id_auth_users_fk'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_id_auth_users_fk"
      FOREIGN KEY ("id")
      REFERENCES auth.users("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
  END IF;
END $$;
