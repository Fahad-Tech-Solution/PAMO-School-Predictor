import type { AppUser } from "@/lib/auth/types";
import { userCanWrite } from "@/lib/auth/roles";

/**
 * UI-only gate for write controls.
 * Server mutations must still call requireAdmin().
 */
export function AdminOnly({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  if (!userCanWrite(user)) {
    return null;
  }
  return <>{children}</>;
}
