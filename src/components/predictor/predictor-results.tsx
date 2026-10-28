import { residencyLabel } from "@/lib/applications/residency";
import type { PredictorSchoolResult } from "@/lib/predictor/run";
import { cn } from "@/lib/utils";

function evidenceClass(evidence: PredictorSchoolResult["evidence"]) {
  switch (evidence) {
    case "Strong":
      return "bg-emerald-50 text-emerald-800";
    case "Moderate":
      return "bg-sky-50 text-sky-800";
    case "Limited":
      return "bg-amber-50 text-amber-900";
    case "Insufficient":
      return "bg-muted text-muted-foreground";
  }
}

export function PredictorResults({
  results,
  message,
}: {
  results: PredictorSchoolResult[];
  message?: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Results</h3>
        {message ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          Historical applications with similar characteristics had these
          outcomes. This is decision support — not a guarantee of admission, and
          not proof of causation.
        </p>
      </div>

      <div className="space-y-3">
        {results.map((row) => (
          <article
            key={row.schoolId}
            className="rounded-lg border border-border bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Rank #{row.rank}
                </p>
                <h4 className="text-sm font-semibold text-primary">
                  {row.schoolName}
                </h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.schoolStateLabel} ·{" "}
                  {residencyLabel(row.candidateResidency)} for this profile
                  {!row.isActive ? " · Inactive school" : ""}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                  evidenceClass(row.evidence),
                )}
              >
                Evidence: {row.evidence}
              </span>
            </div>

            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Similar historical applicants
                </dt>
                <dd className="font-medium">{row.similarCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Historical pool at school
                </dt>
                <dd className="font-medium">{row.historicalPoolSize}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Acceptance rate (excl. unknown)
                </dt>
                <dd className="font-medium">
                  {row.acceptanceRate == null
                    ? "—"
                    : `${Math.round(row.acceptanceRate * 100)}%`}
                </dd>
              </div>
            </dl>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <OutcomeStat
                label="Accepted"
                value={row.outcomes.accepted}
                tone="accepted"
              />
              <OutcomeStat
                label="Not accepted"
                value={row.outcomes.notAccepted}
                tone="notAccepted"
              />
              <OutcomeStat label="Waitlisted" value={row.outcomes.waitlisted} />
              <OutcomeStat label="Unknown" value={row.outcomes.unknown} />
            </div>

            {row.evidence === "Insufficient" ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Insufficient comparable historical data for a confident read.
                Treat this school&apos;s ranking cautiously.
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Similarity uses normalized BCP/Overall/Science GPA, capped PCE hours,
        and residency match vs each school. Outcomes are never used as inputs.
        Waitlisted and Unknown are never treated as Not accepted.
      </p>
    </section>
  );
}

function OutcomeStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "accepted" | "notAccepted";
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2",
        tone === "accepted" &&
          "border-primary bg-primary text-primary-foreground",
        tone === "notAccepted" &&
          "border-secondary bg-secondary text-secondary-foreground",
        !tone && "border-border bg-muted/30 text-foreground",
      )}
    >
      <p
        className={cn(
          "text-xs",
          tone === "accepted" && "text-primary-foreground/85",
          tone === "notAccepted" && "text-secondary-foreground/80",
          !tone && "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
