"use client";

import type { ReactNode } from "react";

import { MountedOnly } from "@/components/charts/mounted-only";

type ChartCardProps = {
  title: string;
  description?: string;
  /** Headline number(s) under the title (averages, percentages, etc.). */
  summary?: ReactNode;
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
};

export function ChartCard({
  title,
  description,
  summary,
  children,
  empty = false,
  emptyMessage = "No data for this chart.",
}: ChartCardProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
        {summary && !empty ? (
          <div className="mt-2 text-sm font-semibold tabular-nums text-primary">
            {summary}
          </div>
        ) : null}
      </div>
      {empty ? (
        <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="h-[220px] w-full">
          <MountedOnly
            fallback={
              <div className="h-full w-full animate-pulse rounded-md bg-muted/40" />
            }
          >
            {children}
          </MountedOnly>
        </div>
      )}
    </div>
  );
}

export function seriesHasCounts(
  data: Array<{ label: string; count: number }>,
): boolean {
  return data.some((d) => d.count > 0);
}
