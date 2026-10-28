"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { ChartCard, seriesHasCounts } from "@/components/charts/chart-card";
import type { ChartDatum } from "@/lib/statistics/bins";
import { formatPercent, withPercents } from "@/lib/statistics/format";

const COLORS = ["var(--chart-1)", "var(--chart-2)"];

type Props = {
  data: ChartDatum[];
};

export function ResidencyPieChart({ data }: Props) {
  const hasData = seriesHasCounts(data);
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const withPct = withPercents(data);
  const summary = withPct
    .filter((row) => row.count > 0)
    .map((row) => `${row.label}: ${row.count} (${Math.round(row.sharePct)}%)`)
    .join(" · ");

  return (
    <ChartCard
      title="Residency"
      description="Derived from applicant home state vs school state."
      summary={summary || undefined}
      empty={!hasData}
      emptyMessage="No residency data yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={withPct}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="45%"
            outerRadius={70}
            label={({ name, value }) =>
              `${name}: ${value} (${formatPercent(Number(value ?? 0), total)})`
            }
          >
            {withPct.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={COLORS[index % COLORS.length]}
                stroke="var(--background)"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => {
              const count = Number(value ?? 0);
              return [`${count} (${formatPercent(count, total)})`, "Applications"];
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
