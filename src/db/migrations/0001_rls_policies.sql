-- RLS / authorization foundation
-- Unauthenticated → no access
-- ADMIN → read/write
-- VIEWER → read only
-- App users.id is expected to match auth.users.id (wired in Step 3).

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.users
  WHERE id = auth.uid()
    AND is_active = true
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND is_active = true
      AND role = 'ADMIN'
  )
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.is_app_reader()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND is_active = true
      AND role IN ('ADMIN', 'VIEWER')
  )
$$;--> statement-breakpoint

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY users_select_authenticated
  ON public.users FOR SELECT
  TO authenticated
  USING (public.is_app_reader());--> statement-breakpoint

CREATE POLICY users_insert_admin
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());--> statement-breakpoint

CREATE POLICY users_update_admin
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());--> statement-breakpoint

CREATE POLICY users_delete_admin
  ON public.users FOR DELETE
  TO authenticated
  USING (public.is_app_admin());--> statement-breakpoint

CREATE POLICY schools_select_authenticated
  ON public.schools FOR SELECT
  TO authenticated
  USING (public.is_app_reader());--> statement-breakpoint

CREATE POLICY schools_insert_admin
  ON public.schools FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());--> statement-breakpoint

CREATE POLICY schools_update_admin
  ON public.schools FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());--> statement-breakpoint

CREATE POLICY schools_delete_admin
  ON public.schools FOR DELETE
  TO authenticated
  USING (public.is_app_admin());--> statement-breakpoint

CREATE POLICY applicants_select_authenticated
  ON public.applicants FOR SELECT
  TO authenticated
  USING (public.is_app_reader());--> statement-breakpoint

CREATE POLICY applicants_insert_admin
  ON public.applicants FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());--> statement-breakpoint

CREATE POLICY applicants_update_admin
  ON public.applicants FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());--> statement-breakpoint

CREATE POLICY applicants_delete_admin
  ON public.applicants FOR DELETE
  TO authenticated
  USING (public.is_app_admin());--> statement-breakpoint

CREATE POLICY applications_select_authenticated
  ON public.applications FOR SELECT
  TO authenticated
  USING (public.is_app_reader());--> statement-breakpoint

CREATE POLICY applications_insert_admin
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());--> statement-breakpoint

CREATE POLICY applications_update_admin
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());--> statement-breakpoint

CREATE POLICY applications_delete_admin
  ON public.applications FOR DELETE
  TO authenticated
  USING (public.is_app_admin());--> statement-breakpoint

CREATE POLICY audit_logs_select_authenticated
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_app_reader());--> statement-breakpoint

CREATE POLICY audit_logs_insert_admin
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_app_admin());--> statement-breakpoint

REVOKE ALL ON public.users FROM anon;--> statement-breakpoint
REVOKE ALL ON public.schools FROM anon;--> statement-breakpoint
REVOKE ALL ON public.applicants FROM anon;--> statement-breakpoint
REVOKE ALL ON public.applications FROM anon;--> statement-breakpoint
REVOKE ALL ON public.audit_logs FROM anon;--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applicants TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
