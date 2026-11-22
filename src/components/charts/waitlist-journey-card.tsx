"use client";

import { ChartCard } from "@/components/charts/chart-card";
import type { WaitlistJourneyStats } from "@/lib/statistics/waitlist-journey";

type Props = {
  stats: WaitlistJourneyStats;
};

function formatDays(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Math.round(value)} days`;
}

function formatPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Math.round(value)}%`;
}

export function WaitlistJourneyCard({ stats }: Props) {
  const empty = stats.everWaitlisted === 0;

  return (
    <ChartCard
      title="Waitlist → acceptance"
      description="Share of waitlisted applicants who later received acceptance, and average time on the waitlist when both dates are recorded."
      empty={empty}
      emptyMessage="No waitlisted applications recorded for this school yet."
    >
      <div className="flex h-full flex-col justify-center gap-6 px-1">
        <div>
          <p className="text-xs text-muted-foreground">
            Waitlisted who later accepted
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">
            {formatPct(stats.conversionPct)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.acceptedAfterWaitlist} of {stats.everWaitlisted} ever
            waitlisted
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            Average time on waitlist
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">
            {formatDays(stats.avgDaysToAcceptance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.avgDaysSampleSize > 0
              ? `Based on ${stats.avgDaysSampleSize} accepted-after-waitlist record${
                  stats.avgDaysSampleSize === 1 ? "" : "s"
                } with both dates`
              : "Needs waitlisted + accepted dates on accepted-after-waitlist records"}
          </p>
        </div>
      </div>
    </ChartCard>
  );
}
