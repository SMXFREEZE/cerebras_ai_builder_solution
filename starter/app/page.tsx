import Link from "next/link";

const LINKS = [
  { href: "/tech", label: "Tech console", meta: "Scan workflows" },
  { href: "/manager", label: "Manager dashboard", meta: "Assets and events" },
  { href: "/manager/reconcile", label: "Reconciliation", meta: "Ops x facilities x finance" },
  { href: "/dev/barcodes", label: "Barcode sheet", meta: "Printable QR test set" },
];

export default function HomePage() {
  return (
    <div className="space-y-5">
      <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Cerebras manufacturing
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-950">
          Asset tracking operations
        </h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metric label="Hot path" value="4 scans" />
          <Metric label="Systems" value="3-way" />
          <Metric label="Views" value="Tech + manager" />
          <Metric label="Token" value="Server-only" />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md border border-gray-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md"
          >
            <div className="text-sm font-semibold text-gray-500">{link.meta}</div>
            <div className="mt-2 text-xl font-semibold text-blue-700">
              {link.label}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-gray-50 p-3 ring-1 ring-inset ring-gray-200">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 font-semibold text-gray-950">{value}</div>
    </div>
  );
}
