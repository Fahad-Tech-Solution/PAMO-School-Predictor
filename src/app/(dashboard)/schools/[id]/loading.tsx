import { SchoolStatisticsSkeleton } from "@/components/charts/school-statistics-skeleton";

export default function SchoolDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-28 rounded-md bg-muted" />
        <div className="h-6 w-64 max-w-full rounded-md bg-muted" />
        <div className="h-4 w-48 max-w-full rounded-md bg-muted" />
      </div>

      <div className="h-36 animate-pulse rounded-lg border border-border bg-muted/40" />

      <SchoolStatisticsSkeleton />
    </div>
  );
}
