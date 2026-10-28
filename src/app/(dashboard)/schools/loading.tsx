export default function SchoolsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="animate-pulse space-y-2">
          <div className="h-6 w-28 rounded-md bg-muted" />
          <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
        <span
          className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
          aria-hidden
        />
        <span>Loading schools…</span>
      </div>

      <div className="h-28 animate-pulse rounded-lg border border-border bg-muted/40" />

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <div className="space-y-0 divide-y divide-border">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="grid animate-pulse grid-cols-3 gap-4 px-4 py-3 sm:grid-cols-5"
            >
              <div className="h-4 rounded-md bg-muted sm:col-span-2" />
              <div className="h-4 rounded-md bg-muted" />
              <div className="hidden h-4 rounded-md bg-muted sm:block" />
              <div className="h-4 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
