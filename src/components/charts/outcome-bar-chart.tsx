"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard, seriesHasCounts } from "@/components/charts/chart-card";
import type { ChartDatum } from "@/lib/statistics/bins";
import { formatPercent, withPercents } from "@/lib/statistics/format";

const OUTCOME_COLORS: Record<string, string> = {
  Accepted: "var(--chart-1)",
  "Not accepted": "var(--chart-3)",
  Waitlisted: "var(--chart-2)",
  Unknown: "var(--chart-4)",
};

type Props = {
  data: ChartDatum[];
};

export function OutcomeBarChart({ data }: Props) {
  const hasData = seriesHasCounts(data);
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const withPct = withPercents(data);
  const summary = withPct
    .filter((row) => row.count > 0)
    .map((row) => `${row.label}: ${row.count} (${Math.round(row.sharePct)}%)`)
    .join(" · ");

  return (
    <ChartCard
      title="Outcomes"
      description="Unknown (null status) is distinct from Not accepted."
      summary={summary || undefined}
      empty={!hasData}
      emptyMessage="No outcome data yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={withPct}
          margin={{ top: 18, right: 8, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
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
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {withPct.map((entry) => (
              <Cell
                key={entry.label}
                fill={OUTCOME_COLORS[entry.label] ?? "var(--chart-1)"}
              />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              className="fill-foreground text-[10px]"
              formatter={(value) => {
                const count = Number(value ?? 0);
                if (count <= 0) return "";
                return `${count}`;
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
