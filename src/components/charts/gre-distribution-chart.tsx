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
import { formatAverage } from "@/lib/statistics/format";

type Props = {
  data: ChartDatum[];
  averageScore?: number | null;
  sampleSize?: number;
};

export function GreDistributionChart({
  data,
  averageScore = null,
  sampleSize = 0,
}: Props) {
  const hasData = seriesHasCounts(data);
  const avgLabel = formatAverage(averageScore, 0);
  const summary =
    avgLabel != null
      ? `Average GRE: ${avgLabel} (n=${sampleSize})`
      : undefined;

  return (
    <ChartCard
      title="GRE score (combined)"
      description="Verbal + Quantitative totals in 5-point bands (270–330). Missing values omitted."
      summary={summary}
      empty={!hasData}
      emptyMessage="No GRE scores recorded for this school."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 18, right: 4, left: 0, bottom: 28 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
            interval={0}
            angle={-40}
            textAnchor="end"
            height={64}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            width={36}
            label={{
              value: "Students",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 10, fill: "var(--muted-foreground)" },
            }}
          />
          <Tooltip
            formatter={(value) => [String(value ?? 0), "Students"]}
            labelFormatter={(label) => `GRE ${label}`}
          />
          <Bar dataKey="count" fill="var(--chart-3)" radius={[3, 3, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              className="fill-foreground text-[9px]"
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
