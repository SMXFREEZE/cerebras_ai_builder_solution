import Link from "next/link";
import { PrintSheetButton } from "@/components/PrintSheetButton";
import { code128Svg } from "@/lib/code128";
import { qrSvg } from "@/lib/qr";

type Code = {
  label: string;
  value: string;
  group: "Assets" | "Locations" | "Badges";
  note?: string;
};

const CODES: Code[] = [
  // Assets: cover the interesting cases per the brief.
  {
    label: "Fresh demo (unreceived)",
    value: "C0009001",
    group: "Assets",
    note: "Receive flow happy path",
  },
  { label: "Second demo", value: "C0009002", group: "Assets" },
  {
    label: "Seeded in-service",
    value: "C0000101",
    group: "Assets",
    note: "Already deployed; Store flow de-racks",
  },
  { label: "Seeded stored", value: "C0000104", group: "Assets" },
  {
    label: "Drifted (RMA mismatch)",
    value: "C0000108",
    group: "Assets",
    note: "Appears in reconcile as review",
  },
  {
    label: "Drifted (rack mismatch)",
    value: "C0000110",
    group: "Assets",
    note: "Appears in reconcile as critical",
  },
  {
    label: "Disposed (rejected transitions)",
    value: "C0000150",
    group: "Assets",
    note: "All scans rejected with invalid_transition",
  },
  {
    label: "Ghost (in finance, no ops)",
    value: "C9999001",
    group: "Assets",
    note: "Unknown to ops; receive returns 404",
  },
  // Locations: receiving, storage, deploy with and without RU.
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
    label: "Deploy rack (complete)",
    value: "Lab-Building-A/Bay-12/Aisle-3/B-04/U21",
    group: "Locations",
  },
  {
    label: "Deploy missing RU",
    value: "Lab-Building-A/Bay-12/Aisle-3/B-04",
    group: "Locations",
    note: "Triggers incomplete_deploy_location",
  },
  // Badges.
  { label: "Receiver - Mike", value: "tech-mike", group: "Badges" },
  { label: "Receiver - Ana", value: "tech-ana", group: "Badges" },
  {
    label: "Receiver - Paul (manager)",
    value: "manager-paul",
    group: "Badges",
  },
];

const GROUPS: Code["group"][] = ["Assets", "Locations", "Badges"];

export default async function BarcodePage() {
  const codes = await Promise.all(
    CODES.map(async (code) => ({
      ...code,
      code128: code128Svg(code.value),
      qr: await qrSvg(code.value),
    })),
  );

  return (
    <div className="space-y-8 py-6 print:py-0">
      <header className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            Dev tools
          </p>
          <h1 className="display mt-3 text-3xl sm:text-4xl">
            Test barcode sheet
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--text-dim)]">
            QR codes for phone camera scanning, plus Code 128 for handheld
            scanners. Covers happy path, drift, ghosts, disposed, and a deploy
            without an RU. Print to paper or scan from a second screen.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/tech"
            className="inline-flex h-9 items-center rounded-lg border border-[var(--border-strong)] bg-white/[0.02] px-3 text-[13px] text-[var(--text-dim)] transition hover:bg-white/[0.05] hover:text-white"
          >
            {"<-"} Tech console
          </Link>
          <PrintSheetButton />
        </div>
      </header>

      <section className="rounded-xl border border-cyan-200/15 bg-cyan-200/[0.035] p-4 print:hidden">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-cyan-100/65">
          Scan guidance
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--text-dim)]">
          Use the QR square for phone-camera scans, especially for long rack and
          shelf locations. Use Code 128 for USB/Bluetooth handheld scanners. Run{" "}
          <code className="font-mono text-cyan-100">POST /v1/reset</code> before
          recording if you want the seeded drift cases back to a clean baseline.
        </p>
      </section>

      {GROUPS.map((group) => {
        const items = codes.filter((code) => code.group === group);
        return (
          <section key={group} className="space-y-4">
            <div className="flex items-baseline justify-between border-b hairline pb-2 print:border-gray-200">
              <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)] print:text-gray-700">
                {group}
              </h2>
              <span className="font-mono text-[11px] text-[var(--text-mute)] print:text-gray-500">
                {items.length} codes
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((code) => (
                <article
                  key={code.value}
                  className="break-inside-avoid rounded-xl border hairline bg-white p-4 text-gray-900 print:border-gray-200 print:shadow-none"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[13px] font-semibold text-gray-950">
                      {code.label}
                    </div>
                  </div>
                  <div className="mt-1 break-words font-mono text-[11px] text-gray-500">
                    {code.value}
                  </div>
                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">
                        Phone QR
                      </div>
                      <div
                        className="inline-flex max-w-full rounded-lg border border-gray-200 bg-white p-2"
                        dangerouslySetInnerHTML={{ __html: code.qr }}
                      />
                    </div>
                    <div>
                      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">
                        Code 128
                      </div>
                      <div className="w-full overflow-x-auto rounded-lg border border-gray-100 bg-white p-2">
                        <div
                          className="min-w-max"
                          dangerouslySetInnerHTML={{ __html: code.code128 }}
                        />
                      </div>
                    </div>
                  </div>
                  {code.note ? (
                    <div className="mt-2 text-[11px] leading-snug text-gray-500 print:text-gray-700">
                      {code.note}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
