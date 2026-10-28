import { SchoolStatisticsSection } from "@/components/charts/school-statistics-section";
import { getSchoolStatistics } from "@/lib/statistics/school-stats";

type Props = {
  schoolId: string;
};

export async function SchoolStatisticsLoader({ schoolId }: Props) {
  const stats = await getSchoolStatistics(schoolId);
  if (!stats) return null;
  return <SchoolStatisticsSection stats={stats} />;
}
