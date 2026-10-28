-- Force RLS so table owners cannot skip policies.
-- Superusers and roles with BYPASSRLS (e.g. typical Supabase postgres role
-- used by DATABASE_URL / Drizzle) still bypass — keep that server secret.
-- PostgREST authenticated/anon clients remain fully constrained by policies.

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.schools FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.applicants FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.applications FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
