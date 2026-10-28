import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/lib/auth/session";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return <AppShell user={user}>{children}</AppShell>;
}
