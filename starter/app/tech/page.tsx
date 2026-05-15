import Link from "next/link";

const WORKFLOWS = [
  {
    href: "/tech/receive",
    title: "Receive",
    meta: "Dock",
    tone: "border-sky-200 bg-sky-50",
  },
  {
    href: "/tech/store",
    title: "Store",
    meta: "Inventory",
    tone: "border-amber-200 bg-amber-50",
  },
  {
    href: "/tech/deploy",
    title: "Deploy",
    meta: "Rack",
    tone: "border-emerald-200 bg-emerald-50",
  },
  {
    href: "/tech/transfer",
    title: "Transfer",
    meta: "Custody",
    tone: "border-violet-200 bg-violet-50",
  },
];

export default function TechLandingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Technician
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Scan console
          </h1>
        </div>
        <Link
          href="/dev/barcodes"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Barcodes
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {WORKFLOWS.map((workflow) => (
          <Link
            key={workflow.href}
            href={workflow.href}
            className={`min-h-[128px] rounded-md border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${workflow.tone}`}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {workflow.meta}
            </div>
            <div className="mt-3 text-2xl font-semibold text-gray-950">
              {workflow.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
