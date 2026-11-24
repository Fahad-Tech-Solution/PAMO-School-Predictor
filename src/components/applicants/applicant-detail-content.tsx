import Link from "next/link";
import { notFound } from "next/navigation";

import { AddApplicationForm } from "@/components/applications/add-application-form";
import { ApplicantHomeStateForm } from "@/components/applications/applicant-home-state-form";
import { BackToApplicationsLink } from "@/components/applications/back-to-applications-link";
import { buttonVariants } from "@/components/ui/button";
import { formatApplicantLabel } from "@/lib/applicants/name";
import { residencyLabel } from "@/lib/applications/residency";
import { statusLabel } from "@/lib/applications/status";
import { getApplicantById } from "@/lib/applications/queries";
import { getStateLabel } from "@/lib/geo/us-states";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  isAdmin: boolean;
};

export async function ApplicantDetailContent({ id, isAdmin }: Props) {
  const data = await getApplicantById(id);

  if (!data) {
    notFound();
  }

  const { applicant, applications } = data;
  const homeStateLabel = getStateLabel(applicant.homeState);
  const displayName = formatApplicantLabel({
    ...applicant,
    homeStateLabel,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <BackToApplicationsLink />
          <h2 className="mt-2 text-lg font-semibold text-primary">
            {displayName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Home state: {homeStateLabel} · {applications.length} application
            {applications.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Applications</h3>
        <p className="text-sm text-muted-foreground">
          Open a school to edit that application’s academics, outcome, and
          dates.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">School</th>
                <th className="px-4 py-3 font-medium">Residency</th>
                <th className="px-4 py-3 font-medium">Attempt</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No applications yet.
                  </td>
                </tr>
              ) : (
                applications.map(({ application, school, residency }) => (
                  <tr
                    key={application.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/applications/${application.id}`}
                        className={cn(
                          buttonVariants({ variant: "link" }),
                          "h-auto px-0",
                        )}
                      >
                        {school.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {getStateLabel(school.state)}
                      </div>
                    </td>
                    <td className="px-4 py-3">{residencyLabel(residency)}</td>
                    <td className="px-4 py-3">
                      {application.applicationAttempt}
                    </td>
                    <td className="px-4 py-3">
                      {statusLabel(application.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin ? (
        <div className="rounded-lg border border-border bg-white p-4">
          <h3 className="mb-1 text-sm font-semibold">Edit applicant</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Name and home state apply to every school listed above.
          </p>
          <ApplicantHomeStateForm applicant={applicant} />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-white p-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{displayName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Home state</dt>
              <dd className="font-medium">{homeStateLabel}</dd>
            </div>
          </dl>
        </div>
      )}

      {isAdmin ? (
        <details className="rounded-lg border border-border bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-primary">
            Add another application to a school
          </summary>
          <p className="mt-2 text-sm text-muted-foreground">
            Creates a new school application for this same applicant — it does
            not update an existing row.
          </p>
          <div className="mt-4">
            <AddApplicationForm applicantId={applicant.id} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
