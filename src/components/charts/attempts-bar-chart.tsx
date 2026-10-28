"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard, seriesHasCounts } from "@/components/charts/chart-card";
import type { ChartDatum } from "@/lib/statistics/bins";
import { formatPercent, withPercents } from "@/lib/statistics/format";

type Props = {
  data: ChartDatum[];
};

export function AttemptsBarChart({ data }: Props) {
  const hasData = seriesHasCounts(data);
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const withPct = withPercents(data);
  const summary = withPct
    .filter((row) => row.count > 0)
    .map((row) => `${row.label}: ${row.count} (${Math.round(row.sharePct)}%)`)
    .join(" · ");

  return (
    <ChartCard
      title="Application attempts"
      description="1st through 5th attempt; 6+ preserved when present."
      summary={summary || undefined}
      empty={!hasData}
      emptyMessage="No attempt data yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={withPct}
          margin={{ top: 18, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            width={36}
          />
          <Tooltip
            formatter={(value) => {
              const count = Number(value ?? 0);
              return [`${count} (${formatPercent(count, total)})`, "Applications"];
            }}
          />
          <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              className="fill-foreground text-[10px]"
              formatter={(value) => {
                const count = Number(value ?? 0);
                return count > 0 ? String(count) : "";
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
