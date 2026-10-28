import Link from "next/link";

import {
  ActivityListCard,
  ActivityRow,
  decisionIcon,
  formatActivityWhen,
  schoolStatusIcon,
} from "@/components/dashboard/activity-list-card";
import { buttonVariants } from "@/components/ui/button";
import { residencyLabel } from "@/lib/applications/residency";
import type {
  DashboardCounts,
  DashboardRecentApplication,
  DashboardRecentSchool,
} from "@/lib/dashboard/queries";
import { getStateLabel } from "@/lib/geo/us-states";
import { cn } from "@/lib/utils";

export function DashboardOverview({
  counts,
  recentApplications,
  recentSchools,
  isAdmin,
}: {
  counts: DashboardCounts;
  recentApplications: DashboardRecentApplication[];
  recentSchools: DashboardRecentSchool[];
  isAdmin: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of PA school admissions data. Totals and recent lists are
          cached briefly for speed.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active schools"
          value={`${counts.schoolsActive} / ${counts.schoolsTotal}`}
        />
        <StatCard label="Applicants" value={String(counts.applicants)} />
        <StatCard label="Applications" value={String(counts.applications)} />
        <StatCard
          label="Accepted"
          value={String(counts.accepted)}
          hint={`${counts.notAccepted} not accepted · ${counts.waitlisted} waitlisted · ${counts.unknown} unknown`}
        />
      </div>

      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="text-sm font-semibold text-foreground">Outcomes</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="Accepted" value={counts.accepted} tone="accepted" />
          <MiniStat
            label="Not accepted"
            value={counts.notAccepted}
            tone="notAccepted"
          />
          <MiniStat label="Waitlisted" value={counts.waitlisted} />
          <MiniStat label="Unknown" value={counts.unknown} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="text-sm font-semibold text-foreground">Quick links</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/applications" className={cn(buttonVariants())}>
            Applications
          </Link>
          <Link
            href="/schools"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Schools
          </Link>
          <Link
            href="/predictor"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Predictor
          </Link>
          {isAdmin ? (
            <Link
              href="/settings"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Settings
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityListCard
          title="Recent applications"
          subtitle="Latest application activity."
          viewAllHref="/applications"
          isEmpty={recentApplications.length === 0}
          emptyMessage="No applications yet."
        >
          {recentApplications.map((row) => {
            const icon = decisionIcon(row.status);
            return (
              <ActivityRow
                key={row.id}
                href={`/applications/${row.id}`}
                icon={icon.icon}
                iconClassName={icon.className}
                title={row.schoolName}
                subtitle={getStateLabel(row.schoolState)}
                when={formatActivityWhen(row.createdAt)}
                primaryRight={row.statusLabel}
                primaryRightClassName={
                  row.status === "ACCEPTED" || row.status === "WAITLISTED"
                    ? "text-primary"
                    : undefined
                }
                secondaryRight={residencyLabel(row.residency)}
              />
            );
          })}
        </ActivityListCard>

        <ActivityListCard
          title="Recent schools"
          subtitle="Latest schools added to the catalog."
          viewAllHref="/schools"
          isEmpty={recentSchools.length === 0}
          emptyMessage="No schools yet."
        >
          {recentSchools.map((row) => {
            const icon = schoolStatusIcon(row.isActive);
            return (
              <ActivityRow
                key={row.id}
                href={`/schools/${row.id}`}
                icon={icon.icon}
                iconClassName={icon.className}
                title={row.name}
                subtitle={getStateLabel(row.state)}
                when={formatActivityWhen(row.createdAt)}
                primaryRight={row.isActive ? "Active" : "Inactive"}
                primaryRightClassName={
                  row.isActive
                    ? "text-primary"
                    : "text-secondary-foreground"
                }
                secondaryRight={
                  row.requiresGre ? "GRE required" : "GRE not required"
                }
              />
            );
          })}
        </ActivityListCard>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-primary">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function MiniStat({
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
