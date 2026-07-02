export default function AssetDetailLoading() {
  return (
    <div
      className="space-y-6 py-6"
      aria-busy="true"
      aria-label="Loading asset detail"
    >
      {/* Back link + title row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <Bar className="h-4 w-28" />
          <div className="flex items-center gap-3">
            <Bar className="h-9 w-44" />
            <Bar className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <Bar className="h-10 w-28 rounded-lg" />
      </div>

      {/* Facts */}
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border hairline bg-white/[0.02] p-4">
            <Bar className="h-3 w-16" />
            <Bar className="mt-3 h-5 w-3/4" />
          </div>
        ))}
      </div>

      {/* Placement + procurement */}
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <section
            key={i}
            className="rounded-xl border hairline bg-white/[0.02] p-5"
          >
            <Bar className="h-3 w-36" />
            <Bar className="mt-4 h-6 w-2/3" />
            <Bar className="mt-4 h-4 w-1/2" />
          </section>
        ))}
      </div>

      {/* Event log */}
      <section className="overflow-hidden rounded-xl border hairline bg-white/[0.015]">
        <div className="border-b hairline px-4 py-3">
          <Bar className="h-3 w-24" />
        </div>
        <div className="divide-y divide-[var(--border)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid gap-3 px-4 py-4 md:grid-cols-5">
              <div className="space-y-2 md:col-span-2">
                <Bar className="h-4 w-32" />
                <Bar className="h-3 w-40" />
              </div>
              <Bar className="h-4 w-24" />
              <Bar className="h-4 w-28" />
              <Bar className="h-4 w-32" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Bar({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-white/[0.05] ${className}`} />
  );
}
