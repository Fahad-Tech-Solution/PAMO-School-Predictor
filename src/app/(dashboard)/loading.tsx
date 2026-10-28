export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-6 w-40 rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
      </div>
      <div className="h-28 rounded-lg border border-border bg-muted/40" />
      <div className="space-y-3 rounded-lg border border-border bg-white p-4">
        <div className="h-4 w-full rounded-md bg-muted" />
        <div className="h-4 w-11/12 rounded-md bg-muted" />
        <div className="h-4 w-4/5 rounded-md bg-muted" />
        <div className="h-4 w-2/3 rounded-md bg-muted" />
        <div className="h-4 w-3/4 rounded-md bg-muted" />
      </div>
    </div>
  );
}
