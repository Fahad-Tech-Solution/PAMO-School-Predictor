import { Suspense } from "react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { requireAuth } from "@/lib/auth/session";
import {
  getDashboardCounts,
  getRecentApplications,
  getRecentSchools,
} from "@/lib/dashboard/queries";

export const instant = false;

async function DashboardBody({ isAdmin }: { isAdmin: boolean }) {
  const [counts, recentApplications, recentSchools] = await Promise.all([
    getDashboardCounts(),
    getRecentApplications(5),
    getRecentSchools(5),
  ]);

  return (
    <DashboardOverview
      counts={counts}
      recentApplications={recentApplications}
      recentSchools={recentSchools}
      isAdmin={isAdmin}
    />
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-border bg-muted/40"
          />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-lg border border-border bg-muted/30" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
        <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardBody isAdmin={user.role === "ADMIN"} />
    </Suspense>
  );
}
