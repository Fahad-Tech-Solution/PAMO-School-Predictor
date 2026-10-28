import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for ADMIN provisioning only.
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRole) {
    return null;
  }

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
