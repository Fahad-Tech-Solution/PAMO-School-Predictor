import type { AppUser } from "@/lib/auth/types";
import type { UserRole } from "@/types";

export function canWrite(role: UserRole | null | undefined): boolean {
  return role === "ADMIN";
}

export function canRead(role: UserRole | null | undefined): boolean {
  return role === "ADMIN" || role === "VIEWER";
}

export function userCanWrite(user: AppUser | null | undefined): boolean {
  return canWrite(user?.role);
}

/**
 * Server-side authorization helper.
 * Every mutation must verify the authenticated user's role.
 * Do not rely on UI visibility alone.
 */
export function assertCanWrite(role: UserRole | null | undefined): void {
  if (!canWrite(role)) {
    throw new Error("Forbidden: ADMIN role required for write operations.");
  }
}

export function assertCanRead(role: UserRole | null | undefined): void {
  if (!canRead(role)) {
    throw new Error("Forbidden: authenticated ADMIN or VIEWER role required.");
  }
}

