import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SchoolStatisticsLoader } from "@/components/charts/school-statistics-loader";
import { SchoolStatisticsSkeleton } from "@/components/charts/school-statistics-skeleton";
import { BackToSchoolsLink } from "@/components/schools/back-to-schools-link";
import { SchoolForm } from "@/components/schools/school-form";
import { SchoolStatusActions } from "@/components/schools/school-status-actions";
import { requireAuth } from "@/lib/auth/session";
import { getStateLabel } from "@/lib/geo/us-states";
import { getSchoolById } from "@/lib/schools/queries";

export const instant = false;

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const school = await getSchoolById(id);

  if (!school) {
    notFound();
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <BackToSchoolsLink />
          <h2 className="mt-2 text-lg font-semibold text-primary">
            {school.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {getStateLabel(school.state)} ·{" "}
            {school.requiresGre ? "GRE required" : "GRE not required"} ·{" "}
            {school.isActive ? "Active" : "Inactive"}
          </p>
        </div>
        {isAdmin ? (
          <SchoolStatusActions
            schoolId={school.id}
            isActive={school.isActive}
          />
        ) : null}
      </div>

      {isAdmin ? (
        <div className="rounded-lg border border-border bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Edit school
          </h3>
          <SchoolForm mode="edit" school={school} />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-white p-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{school.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">State</dt>
              <dd className="font-medium">{getStateLabel(school.state)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">GRE</dt>
              <dd className="font-medium">
                {school.requiresGre ? "Required" : "Not required"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">
                {school.isActive ? "Active" : "Inactive"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <Suspense fallback={<SchoolStatisticsSkeleton />}>
        <SchoolStatisticsLoader schoolId={id} />
      </Suspense>
    </div>
  );
}
