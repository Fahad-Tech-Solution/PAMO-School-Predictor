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
  title: string;
  description: string;
  data: ChartDatum[];
  emptyMessage: string;
  barColor?: string;
};

export function DateMonthBarChart({
  title,
  description,
  data,
  emptyMessage,
  barColor = "var(--chart-2)",
}: Props) {
  const hasData = seriesHasCounts(data);
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const withPct = withPercents(data);
  const datedCount = withPct.filter((row) => row.count > 0).length;
  const summary = hasData
    ? `${total} dated · ${datedCount} month${datedCount === 1 ? "" : "s"}`
    : undefined;

  return (
    <ChartCard
      title={title}
      description={description}
      summary={summary}
      empty={!hasData}
      emptyMessage={emptyMessage}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={withPct}
          margin={{ top: 18, right: 8, left: 0, bottom: 28 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={56}
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
          <Bar dataKey="count" fill={barColor} radius={[3, 3, 0, 0]}>
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
