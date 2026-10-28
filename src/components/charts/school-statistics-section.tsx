import { AttemptsBarChart } from "@/components/charts/attempts-bar-chart";
import { GpaDistributionChart } from "@/components/charts/gpa-distribution-chart";
import { OutcomeBarChart } from "@/components/charts/outcome-bar-chart";
import { PceDistributionChart } from "@/components/charts/pce-distribution-chart";
import { ResidencyPieChart } from "@/components/charts/residency-pie-chart";
import type { SchoolStatistics } from "@/lib/statistics/school-stats";

type Props = {
  stats: SchoolStatistics;
};

export function SchoolStatisticsSection({ stats }: Props) {
  const averages = stats.averages ?? {
    bcpGpa: null,
    overallGpa: null,
    scienceGpa: null,
    pceHours: null,
    bcpGpaN: 0,
    overallGpaN: 0,
    scienceGpaN: 0,
    pceHoursN: 0,
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Statistics</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Historical applications for this school ({stats.totalApplications}{" "}
          total). Charts include counts, percentages, and averages where
          available — not causal relationships.
        </p>
      </div>

      {stats.totalApplications === 0 ? (
        <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-muted-foreground">
          No applications recorded for this school yet. Statistics will appear
          after applications are added.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ResidencyPieChart data={stats.residency} />
          <OutcomeBarChart data={stats.outcomes} />
          <AttemptsBarChart data={stats.attempts} />
          <PceDistributionChart
            data={stats.pceHours}
            averageHours={averages.pceHours}
            sampleSize={averages.pceHoursN}
          />
          <GpaDistributionChart
            title="BCP GPA"
            data={stats.bcpGpa}
            average={averages.bcpGpa}
            sampleSize={averages.bcpGpaN}
          />
          <GpaDistributionChart
            title="Overall GPA"
            data={stats.overallGpa}
            average={averages.overallGpa}
            sampleSize={averages.overallGpaN}
          />
          <GpaDistributionChart
            title="Science GPA"
            data={stats.scienceGpa}
            average={averages.scienceGpa}
            sampleSize={averages.scienceGpaN}
          />
        </div>
      )}
    </section>
  );
}
