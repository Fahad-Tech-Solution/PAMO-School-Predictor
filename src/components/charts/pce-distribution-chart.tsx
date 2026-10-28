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
import { formatHours } from "@/lib/statistics/format";

type Props = {
  data: ChartDatum[];
  averageHours?: number | null;
  sampleSize?: number;
};

export function PceDistributionChart({
  data,
  averageHours = null,
  sampleSize = 0,
}: Props) {
  const hasData = seriesHasCounts(data);
  const avgLabel = formatHours(averageHours);
  const summary =
    avgLabel != null
      ? `Average PCE: ${avgLabel} hours (n=${sampleSize})`
      : undefined;

  return (
    <ChartCard
      title="PCE hours"
      description="Patient care experience in 500-hour bands. Missing values omitted."
      summary={summary}
      empty={!hasData}
      emptyMessage="No PCE hours recorded for this school."
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
            labelFormatter={(label) => `PCE ${label}`}
          />
          <Bar dataKey="count" fill="var(--chart-2)" radius={[3, 3, 0, 0]}>
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
