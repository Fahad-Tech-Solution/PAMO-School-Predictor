export function ApplicationDetailSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading application"
    >
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-36 rounded-md bg-muted" />
        <div className="h-6 w-64 max-w-full rounded-md bg-muted" />
        <div className="h-4 w-52 max-w-full rounded-md bg-muted" />
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
        <span
          className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
          aria-hidden
        />
        <span>Loading application details…</span>
      </div>

      <div className="animate-pulse rounded-lg border border-border bg-white p-4">
        <div className="mb-4 h-4 w-40 rounded-md bg-muted" />
        <div className="mb-6 h-3 w-56 max-w-full rounded-md bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-3 w-20 rounded-md bg-muted" />
              <div className="h-4 w-28 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-48 animate-pulse rounded-lg border border-border bg-muted/40" />
    </div>
  );
}
