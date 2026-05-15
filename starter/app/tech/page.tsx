import Link from "next/link";

const WORKFLOWS = [
  {
    href: "/tech/receive",
    title: "Receive",
    meta: "Dock",
    body: "Inbound scan. Locks the tag to RECEIVED and validates against the PO.",
    n: "01",
  },
  {
    href: "/tech/store",
    title: "Store",
    meta: "Inventory",
    body: "Move from dock to shelf. Facilities row updated; no finance write yet.",
    n: "02",
  },
  {
    href: "/tech/deploy",
    title: "Deploy",
    meta: "Rack",
    body: "Install into a rack. The only event that capitalizes the asset in finance.",
    n: "03",
  },
  {
    href: "/tech/transfer",
    title: "Transfer",
    meta: "Custody",
    body: "Move custody between technicians. Ops record only — facilities and finance untouched.",
    n: "04",
  },
];

export default function TechLandingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            Technician
          </p>
          <h1 className="display mt-3 text-3xl sm:text-4xl">Scan console</h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--text-dim)]">
            Pick a flow. Each scan writes only the records that should change, then emits an audit event.
          </p>
        </div>
        <Link
          href="/dev/barcodes"
          className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] bg-white/[0.02] px-4 text-sm text-white transition hover:bg-white/[0.05]"
        >
          Print test barcodes →
        </Link>
      </header>

      <div className="grid gap-px overflow-hidden rounded-2xl border hairline bg-[var(--border)] sm:grid-cols-2">
        {WORKFLOWS.map((w, i) => (
          <Link
            key={w.href}
            href={w.href}
            className="card-sweep relative block bg-[#0a0a0a] p-7 animate-rise"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="relative z-10">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] text-[var(--text-mute)]">{w.n}</span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-mute)]">
                  {w.meta}
                </span>
              </div>
              <h2 className="display mt-6 text-3xl text-white">{w.title}</h2>
              <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-[var(--text-dim)]">
                {w.body}
              </p>
              <div className="mt-7 inline-flex items-center text-[12px] text-[var(--text-mute)]">
                Open
                <span className="ml-1.5 transition-transform">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
