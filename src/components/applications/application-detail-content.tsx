import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicantHomeStateForm } from "@/components/applications/applicant-home-state-form";
import { ApplicationEditForm } from "@/components/applications/application-edit-form";
import { BackToApplicationsLink } from "@/components/applications/back-to-applications-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatApplicantLabel } from "@/lib/applicants/name";
import { formatDateOnly } from "@/lib/applications/dates";
import {
  buildTimelineEvents,
  isAcceptedAfterWaitlist,
  journeyStatusLabel,
  waitlistToAcceptanceDays,
} from "@/lib/applications/journey";
import { residencyLabel } from "@/lib/applications/residency";
import { getApplicationById } from "@/lib/applications/queries";
import { getStateLabel } from "@/lib/geo/us-states";

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
  const journey = {
    status: application.status,
    interviewAt: application.interviewAt,
    resultsAt: application.resultsAt,
    waitlistedAt: application.waitlistedAt,
    acceptedAt: application.acceptedAt,
  };
  const statusDisplay = journeyStatusLabel(journey);
  const timeline = buildTimelineEvents(journey);
  const waitlistDays = isAcceptedAfterWaitlist(journey)
    ? waitlistToAcceptanceDays(journey.waitlistedAt, journey.acceptedAt)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <BackToApplicationsLink />
        <h2 className="mt-2 text-lg font-semibold text-primary">
          {school.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {getStateLabel(school.state)} · {residencyLabel(residency)} · Attempt{" "}
          {application.applicationAttempt} · {statusDisplay}
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
                  {formatApplicantLabel({
                    ...applicant,
                    homeStateLabel: getStateLabel(applicant.homeState),
                  })}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Home state</dt>
              <dd className="font-medium">
                {getStateLabel(applicant.homeState)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Residency</dt>
              <dd className="font-medium">{residencyLabel(residency)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{statusDisplay}</dd>
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
            {school.requiresGre ? (
              <div>
                <dt className="text-muted-foreground">GRE score (combined)</dt>
                <dd className="font-medium">{application.greScore ?? "—"}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Interview date</dt>
              <dd className="font-medium">
                {formatDateOnly(application.interviewAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Results date</dt>
              <dd className="font-medium">
                {formatDateOnly(application.resultsAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Waitlisted date</dt>
              <dd className="font-medium">
                {formatDateOnly(application.waitlistedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Accepted date</dt>
              <dd className="font-medium">
                {formatDateOnly(application.acceptedAt)}
              </dd>
            </div>
            {waitlistDays != null ? (
              <div>
                <dt className="text-muted-foreground">Days on waitlist</dt>
                <dd className="font-medium">{waitlistDays}</dd>
              </div>
            ) : null}
          </dl>

          {timeline.length > 0 ? (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Timeline
              </p>
              <ol className="mt-2 space-y-1.5 text-sm">
                {timeline.map((event) => (
                  <li key={event.key} className="flex gap-2">
                    <span className="min-w-[9.5rem] font-medium text-foreground">
                      {event.label}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDateOnly(event.at)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isAdmin ? (
        <>
          <div className="space-y-3 rounded-lg border border-border bg-white p-4">
            <div>
              <h3 className="text-base font-semibold text-primary">
                Edit applicant
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Name and home state are shared across every school application
                for this person.
              </p>
            </div>
            <ApplicantHomeStateForm applicant={applicant} />
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-primary">
                Edit application
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Update school, academics, attempt, outcome, and timeline dates.
              </p>
            </div>
            <ApplicationEditForm application={application} school={school} />
          </div>
        </>
      ) : null}
    </div>
  );
}
