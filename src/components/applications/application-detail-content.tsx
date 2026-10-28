import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationEditForm } from "@/components/applications/application-edit-form";
import { BackToApplicationsLink } from "@/components/applications/back-to-applications-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { residencyLabel } from "@/lib/applications/residency";
import { statusLabel } from "@/lib/applications/status";
import { getApplicationById } from "@/lib/applications/queries";
import { getStateLabel } from "@/lib/geo/us-states";

function formatDate(value: Date | null) {
  if (!value) return "—";
  return value.toLocaleString("en-US");
}

type Props = {
  id: string;
  isAdmin: boolean;
};

export async function ApplicationDetailContent({ id, isAdmin }: Props) {
  const row = await getApplicationById(id);

  if (!row) {
    notFound();
  }

  const { application, applicant, school, residency } = row;

  return (
    <div className="space-y-6">
      <div>
        <BackToApplicationsLink />
        <h2 className="mt-2 text-lg font-semibold text-primary">
          {school.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {getStateLabel(school.state)} · {residencyLabel(residency)} · Attempt{" "}
          {application.applicationAttempt} · {statusLabel(application.status)}
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold text-primary">
            Application summary
          </CardTitle>
          <CardDescription>
            Read-only snapshot of the current record.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Applicant</dt>
              <dd className="font-medium">
                <Link
                  href={`/applicants/${applicant.id}`}
                  className="text-primary hover:underline"
                >
                  {getStateLabel(applicant.homeState)}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Residency</dt>
              <dd className="font-medium">{residencyLabel(residency)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{statusLabel(application.status)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">BCP GPA</dt>
              <dd className="font-medium">{application.bcpGpa ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Overall GPA</dt>
              <dd className="font-medium">{application.overallGpa ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Science GPA</dt>
              <dd className="font-medium">{application.scienceGpa ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">PCE hours</dt>
              <dd className="font-medium">{application.pceHours ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Waitlisted at</dt>
              <dd className="font-medium">
                {formatDate(application.waitlistedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Accepted at</dt>
              <dd className="font-medium">
                {formatDate(application.acceptedAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {isAdmin ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-primary">
              Edit application
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Update school, academics, attempt, and outcome.
            </p>
          </div>
          <ApplicationEditForm application={application} school={school} />
        </div>
      ) : null}
    </div>
  );
}
