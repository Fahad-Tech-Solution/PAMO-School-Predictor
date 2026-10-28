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
import { GPA_DISPLAY_DIGITS, type ChartDatum } from "@/lib/statistics/bins";
import { formatAverage } from "@/lib/statistics/format";

type Props = {
  title: string;
  data: ChartDatum[];
  average?: number | null;
  sampleSize?: number;
};

export function GpaDistributionChart({
  title,
  data,
  average = null,
  sampleSize = 0,
}: Props) {
  const hasData = seriesHasCounts(data);
  const avgLabel = formatAverage(average, GPA_DISPLAY_DIGITS);
  const summary =
    avgLabel != null
      ? `Average ${title.replace(/ GPA$/i, "")}: ${avgLabel} (n=${sampleSize})`
      : undefined;

  return (
    <ChartCard
      title={title}
      description="Frequency by GPA band (2.70–4.00). Missing values omitted."
      summary={summary}
      empty={!hasData}
      emptyMessage="No GPA values recorded for this school."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 18, right: 4, left: 0, bottom: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
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
            labelFormatter={(label) => `GPA ${label}`}
          />
          <Bar dataKey="count" fill="var(--chart-1)" radius={[3, 3, 0, 0]}>
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
