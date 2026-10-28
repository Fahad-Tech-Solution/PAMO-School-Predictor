export function SchoolStatisticsSkeleton() {
  return (
    <section
      className="space-y-4"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading school statistics"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">Statistics</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Compiling results and loading charts…
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
        <span
          className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
          aria-hidden
        />
        <span>Gathering historical applications for this school.</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-lg border border-border bg-white p-4"
          >
            <div className="mb-3 h-4 w-28 rounded-md bg-muted" />
            <div className="mb-2 h-3 w-48 max-w-full rounded-md bg-muted" />
            <div className="mt-6 flex h-40 items-center justify-center">
              <div className="size-28 rounded-full bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
