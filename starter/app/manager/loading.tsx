export default function ManagerLoading() {
  return (
    <div className="space-y-8 py-6" aria-busy="true" aria-label="Loading assets">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-xl space-y-3">
          <Bar className="h-3 w-24" />
          <Bar className="h-9 w-72" />
          <Bar className="h-4 w-full max-w-md" />
        </div>
        <Bar className="h-10 w-48 rounded-lg" />
      </header>

      {/* Standup brief */}
      <section className="rounded-xl border hairline bg-white/[0.02] p-5">
        <Bar className="h-3 w-44" />
        <Bar className="mt-4 h-8 w-3/4" />
        <Bar className="mt-3 h-4 w-1/2" />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bar key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </section>

      {/* Metric tiles */}
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid items-start gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="tile min-h-[132px]">
              <Bar className="h-3 w-16" />
              <Bar className="mt-3 h-8 w-12" />
            </div>
          ))}
        </div>
        <div className="tile space-y-2">
          <Bar className="h-3 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Bar key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </section>

      {/* Filters */}
      <div className="rounded-xl border hairline bg-white/[0.015] p-5">
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-16" />
              <Bar className="h-10 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border hairline">
        <div className="border-b hairline bg-white/[0.02] px-4 py-3">
          <Bar className="h-3 w-2/3 max-w-sm" />
        </div>
        <div className="divide-y divide-[var(--border)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-4">
              <Bar className="h-4 w-28" />
              <Bar className="h-5 w-20 rounded-full" />
              <Bar className="hidden h-4 w-64 sm:block" />
              <Bar className="hidden h-4 w-24 md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-white/[0.05] ${className}`} />
  );
}
