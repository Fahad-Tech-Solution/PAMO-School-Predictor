import Link from "next/link";
import { Suspense } from "react";

import { ApplicationFilters } from "@/components/applications/application-filters";
import { ApplicationPagination } from "@/components/applications/application-pagination";
import { RememberApplicationsReturn } from "@/components/applications/remember-applications-return";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session";
import { residencyLabel } from "@/lib/applications/residency";
import { statusLabel } from "@/lib/applications/status";
import { getStateLabel, parseStateParam } from "@/lib/geo/us-states";
import { listApplications } from "@/lib/applications/queries";
import { cn } from "@/lib/utils";

export const instant = false;

function parseStatus(value?: string) {
  if (
    value === "UNKNOWN" ||
    value === "ACCEPTED" ||
    value === "NOT_ACCEPTED" ||
    value === "WAITLISTED"
  ) {
    return value;
  }
  return "all" as const;
}

function parseAttempt(value?: string) {
  if (
    value === "1" ||
    value === "2" ||
    value === "3" ||
    value === "4" ||
    value === "5" ||
    value === "6plus"
  ) {
    return value;
  }
  return "all" as const;
}

function parseResidency(value?: string) {
  if (value === "IN_STATE" || value === "OUT_OF_STATE") return value;
  return "all" as const;
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolId?: string;
    status?: string;
    attempt?: string;
    homeState?: string | string[];
    residency?: string;
    page?: string;
  }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;

  const schoolId = params.schoolId?.trim() ?? "";
  const homeStates = parseStateParam(params.homeState);
  const status = parseStatus(params.status);
  const attempt = parseAttempt(params.attempt);
  const residency = parseResidency(params.residency);
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  // One paginated DB query (+ cached COUNT). Never load all applications client-side.
  const result = await listApplications({
    schoolId: schoolId || undefined,
    homeStates: homeStates.length > 0 ? homeStates : undefined,
    status,
    attempt,
    residency,
    page,
  });

  const filterParams = {
    schoolId: schoolId || undefined,
    homeState: homeStates.length > 0 ? homeStates.join(",") : undefined,
    status: status === "all" ? undefined : status,
    attempt: attempt === "all" ? undefined : attempt,
    residency: residency === "all" ? undefined : residency,
  };

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <RememberApplicationsReturn />
      </Suspense>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Applications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Anonymous historical applications. Applicant identity is home state
            only.
          </p>
        </div>
        {user.role === "ADMIN" ? (
          <Link
            href="/applications/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Add application
          </Link>
        ) : null}
      </div>

      <Suspense fallback={<div className="h-36 rounded-lg border bg-muted/30" />}>
        <ApplicationFilters
          key={[
            schoolId,
            status,
            attempt,
            homeStates.join(","),
            residency,
          ].join("|")}
          schoolId={schoolId}
          schoolLabel={null}
          status={status}
          attempt={attempt}
          homeStates={homeStates}
          residency={residency}
        />
      </Suspense>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">School</th>
              <th className="px-4 py-3 font-medium">Home state</th>
              <th className="px-4 py-3 font-medium">Residency</th>
              <th className="px-4 py-3 font-medium">Attempt</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Overall GPA</th>
              <th className="px-4 py-3 font-medium">PCE</th>
            </tr>
          </thead>
          <tbody>
            {result.items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No applications match these filters.
                </td>
              </tr>
            ) : (
              result.items.map(({ application, applicant, school: s, residency: r }) => (
                <tr
                  key={application.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/applications/${application.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {s.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {getStateLabel(s.state)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/applicants/${applicant.id}`}
                      className="text-primary hover:underline"
                    >
                      {getStateLabel(applicant.homeState)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {residencyLabel(r)}
                  </td>
                  <td className="px-4 py-3">{application.applicationAttempt}</td>
                  <td className="px-4 py-3">
                    {statusLabel(application.status)}
                  </td>
                  <td className="px-4 py-3">
                    {application.overallGpa ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {application.pceHours ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {result.total} application{result.total === 1 ? "" : "s"}
        </p>
        <ApplicationPagination
          page={result.page}
          totalPages={result.totalPages}
          searchParams={filterParams}
        />
      </div>
    </div>
  );
}
