import Link from "next/link";
import { code128Svg } from "@/lib/code128";

const CODES = [
  { label: "Fresh demo asset", value: "C0009001", group: "Assets" },
  { label: "Second demo asset", value: "C0009002", group: "Assets" },
  { label: "Seeded in-service", value: "C0000101", group: "Assets" },
  { label: "Seeded stored", value: "C0000104", group: "Assets" },
  { label: "RMA drift sample", value: "C0000108", group: "Assets" },
  { label: "Rack mismatch sample", value: "C0000110", group: "Assets" },
  {
    label: "Receiving dock",
    value: "Lab-Building-A/Receiving/DOCK-1",
    group: "Locations",
  },
  {
    label: "Storage shelf",
    value: "Lab-Building-A/Storage-1/SHELF-3",
    group: "Locations",
  },
  {
    label: "Deploy rack",
    value: "Lab-Building-A/Bay-12/Aisle-3/B-04/U21",
    group: "Locations",
  },
  {
    label: "Deploy missing RU",
    value: "Lab-Building-A/Bay-12/Aisle-3/B-04",
    group: "Locations",
  },
  { label: "Receiver Mike", value: "tech-mike", group: "Badges" },
  { label: "Receiver Ana", value: "tech-ana", group: "Badges" },
];

export default function BarcodePage() {
  const groups = Array.from(new Set(CODES.map((code) => code.group)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Dev
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Barcode sheet
          </h1>
        </div>
        <Link
          href="/tech"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
        >
          Tech console
        </Link>
      </div>

      {groups.map((group) => (
        <section key={group} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {group}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {CODES.filter((code) => code.group === group).map((code) => (
              <article
                key={code.value}
                className="break-inside-avoid rounded-md border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="text-sm font-semibold text-gray-950">
                  {code.label}
                </div>
                <div className="mt-1 break-words font-mono text-xs text-gray-500">
                  {code.value}
                </div>
                <div
                  className="mt-3 w-full overflow-hidden rounded bg-white"
                  dangerouslySetInnerHTML={{ __html: code128Svg(code.value) }}
                />
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
