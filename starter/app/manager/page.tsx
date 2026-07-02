import Link from "next/link";
import { StateBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { locationLabel } from "@/lib/locations";
import { buildReconcileReport } from "@/lib/reconcile";
import { reconcileEvidenceHref } from "@/lib/reconcile-ui";
import type { ReconcileItem, ReconcileSeverity } from "@/lib/reconcile";
import type { AssetState } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATES: Array<AssetState | ""> = [
  "",
  "received",
  "stored",
  "in_service",
  "rma_pending",
  "disposed",
];
const PAGE_SIZE = 25;

type SearchParams = Promise<{
  state?: string;
  site?: string;
  custodian?: string;
  q?: string;
  page?: string;
}>;

export default async function ManagerLandingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const state = params.state?.trim() || undefined;
  const site = params.site?.trim() || undefined;
  const custodian = params.custodian?.trim() || undefined;
  const q = params.q?.trim().toLowerCase() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  // The upstream API supports state/site/custodian filtering — pass those
  // through instead of filtering in-memory. The reconcile report always needs
  // the full estate, so it keeps its own unfiltered list; when no filters are
  // active both consumers share one request.
  const hasFilters = Boolean(state || site || custodian);
  const allAssetsPromise = api.assets.list();
  const assetsPromise = hasFilters
    ? api.assets.list({ state, site, custodian })
    : allAssetsPromise;
  const [assets, reconcileReport] = await Promise.all([
    assetsPromise,
    buildReconcileReport(allAssetsPromise),
  ]);
  // Free-text search stays in-memory: the upstream list endpoint has no `q`
  // parameter.
  const filtered = q
    ? assets.filter((asset) =>
        [
          asset.asset_tag,
          asset.serial,
          asset.model,
          asset.manufacturer,
          asset.custodian,
          locationLabel(asset.location),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : assets;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const nextParams = new URLSearchParams();
  if (state) nextParams.set("state", state);
  if (site) nextParams.set("site", site);
  if (custodian) nextParams.set("custodian", custodian);
  if (q) nextParams.set("q", q);

  return (
    <div className="space-y-8 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            Manager
          </p>
          <h1 className="display mt-3 text-3xl sm:text-4xl">
            Asset control tower
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--text-dim)]">
            Live estate, exceptions surfaced first. Drill into any asset for
            full event history.
          </p>
        </div>
        <Link
          href="/manager/reconcile"
          className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90"
        >
          Open reconciliation →
        </Link>
      </header>

      <StandupBrief
        topItem={reconcileReport.items[0]}
        criticalCount={reconcileReport.summary.critical}
        reviewCount={reconcileReport.summary.review}
        watchCount={reconcileReport.summary.watch}
        cleanCount={reconcileReport.totals.clean_ops_assets}
      />

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid items-start gap-3 sm:grid-cols-4">
          <Metric
            label="Filtered"
            value={filtered.length.toString()}
            delay={0}
          />
          <Metric
            label="Critical"
            value={reconcileReport.summary.critical.toString()}
            tone="critical"
            delay={60}
          />
          <Metric
            label="Review"
            value={reconcileReport.summary.review.toString()}
            tone="review"
            delay={120}
          />
          <Metric
            label="Clean"
            value={reconcileReport.totals.clean_ops_assets.toString()}
            tone="clean"
            delay={180}
          />
        </div>
        <div className="tile min-h-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
              First actions
            </h2>
            <Link
              href="/manager/reconcile"
              className="text-xs text-white hover:underline decoration-white/40 underline-offset-4"
            >
              Open report →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {reconcileReport.items.slice(0, 3).map((item) => (
              <ActionItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Signal
          label="Reviewer priority"
          value="Critical drift first"
          body="Ops, facilities, and finance mismatches are pinned before clean inventory counts."
        />
        <Signal
          label="Scan contract"
          value="Scoped writebacks"
          body="Deploy writes facilities and finance; transfer only changes custody."
        />
        <Signal
          label="Audit posture"
          value="Event evidence"
          body="Standup triage starts from who scanned what, where, and when."
        />
      </section>

      <form className="rounded-xl border hairline bg-white/[0.015] p-5">
        <div className="grid gap-4 md:grid-cols-5">
          <Field label="State">
            <select
              name="state"
              defaultValue={state ?? ""}
              className="input-dark"
            >
              {STATES.map((item) => (
                <option
                  key={item || "all"}
                  value={item}
                  className="bg-[#0a0a0a]"
                >
                  {item ? item.replace(/_/g, " ") : "All states"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Site">
            <input
              name="site"
              defaultValue={site ?? ""}
              className="input-dark"
              placeholder="Lab-Building-A"
            />
          </Field>
          <Field label="Custodian">
            <input
              name="custodian"
              defaultValue={custodian ?? ""}
              className="input-dark"
              placeholder="tech-jane"
            />
          </Field>
          <Field label="Search" wide>
            <input
              name="q"
              defaultValue={q}
              className="input-dark"
              placeholder="tag, serial, model, location"
            />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90"
          >
            Apply
          </button>
          <Link
            href="/manager"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] bg-white/[0.02] px-4 text-sm text-white transition hover:bg-white/[0.05]"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric
          label="Received"
          value={countState(assets, "received").toString()}
          delay={0}
        />
        <Metric
          label="Stored"
          value={countState(assets, "stored").toString()}
          delay={60}
        />
        <Metric
          label="In service"
          value={countState(assets, "in_service").toString()}
          delay={120}
        />
        <Metric
          label="RMA pending"
          value={countState(assets, "rma_pending").toString()}
          delay={180}
        />
      </div>

      <div className="overflow-hidden rounded-xl border hairline">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] text-sm">
            <thead className="bg-white/[0.02] text-left">
              <tr>
                {["Asset", "State", "Location", "Custodian", "Updated"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {visible.map((asset) => (
                <tr
                  key={asset.asset_tag}
                  className="transition hover:bg-white/[0.025]"
                >
                  <td className="px-4 py-3">
                    <Link
                      className="font-mono text-[13px] text-white hover:underline decoration-white/40 underline-offset-4"
                      href={`/manager/assets/${asset.asset_tag}`}
                    >
                      {asset.asset_tag}
                    </Link>
                    <div className="text-[11px] text-[var(--text-mute)]">
                      {asset.serial}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StateBadge state={asset.state} />
                  </td>
                  <td className="max-w-[320px] px-4 py-3 text-[var(--text-dim)]">
                    {locationLabel(asset.location)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-dim)]">
                    {asset.custodian}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-[var(--text-mute)]">
                    {formatDateTime(asset.updated_at)}
                  </td>
                </tr>
              ))}
              {!visible.length ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-[var(--text-mute)]"
                    colSpan={5}
                  >
                    No assets match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-[var(--text-dim)]">
        <span className="font-mono text-[12px] text-[var(--text-mute)]">
          page {currentPage} / {pageCount}
        </span>
        <div className="flex gap-2">
          <PageLink
            label="Previous"
            disabled={currentPage <= 1}
            params={nextParams}
            page={currentPage - 1}
          />
          <PageLink
            label="Next"
            disabled={currentPage >= pageCount}
            params={nextParams}
            page={currentPage + 1}
          />
        </div>
      </div>
    </div>
  );
}

function StandupBrief({
  topItem,
  criticalCount,
  reviewCount,
  watchCount,
  cleanCount,
}: {
  topItem?: ReconcileItem;
  criticalCount: number;
  reviewCount: number;
  watchCount: number;
  cleanCount: number;
}) {
  if (!topItem) {
    return (
      <section className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.035] p-5">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-200/75">
          60-second standup brief
        </div>
        <div className="mt-3 text-2xl font-medium text-white">
          No exceptions need the room.
        </div>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[var(--text-dim)]">
          Clean inventory can stay quiet. Use the table below for lookup, not
          triage.
        </p>
      </section>
    );
  }

  const tone =
    topItem.severity === "critical"
      ? "border-rose-300/25 bg-rose-300/[0.045]"
      : topItem.severity === "review"
        ? "border-amber-300/25 bg-amber-300/[0.045]"
        : "border-violet-300/25 bg-violet-300/[0.045]";
  const evidenceHref = reconcileEvidenceHref(topItem);

  return (
    <section className={`rounded-xl border p-5 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            60-second standup brief
          </div>
          <h2 className="mt-3 text-2xl font-medium leading-tight text-white sm:text-3xl">
            Start with <span className="font-mono">{topItem.tag}</span>:{" "}
            {topItem.title.toLowerCase()}.
          </h2>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-[var(--text-dim)]">
            {topItem.recommendation}
          </p>
        </div>
        <Link
          href={evidenceHref}
          className="inline-flex h-10 shrink-0 items-center rounded-lg bg-white px-4 text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90"
        >
          Open evidence
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <BriefFact label="Owner" value={topItem.owner} />
        <BriefFact label="Problem type" value={topItem.category} />
        <BriefFact
          label="Why it matters"
          value={topItem.details[0] ?? "The systems disagree."}
          wide
        />
        <BriefFact
          label="Quiet inventory"
          value={`${cleanCount} clean · ${watchCount} watch · ${reviewCount} review · ${criticalCount} fix today`}
        />
      </div>
    </section>
  );
}

function BriefFact({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border hairline bg-black/15 px-3 py-2 ${wide ? "md:col-span-2" : ""}`}
    >
      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {label}
      </div>
      <div className="mt-1 text-[12.5px] leading-snug text-white">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
  delay = 0,
}: {
  label: string;
  value: string;
  tone?: ReconcileSeverity | "clean" | "neutral";
  delay?: number;
}) {
  const toneClass =
    tone === "critical"
      ? "tile-critical"
      : tone === "review"
        ? "tile-review"
        : tone === "clean"
          ? "tile-clean"
          : "";

  const valueClass =
    tone === "critical"
      ? "text-rose-200"
      : tone === "review"
        ? "text-amber-200"
        : tone === "clean"
          ? "text-emerald-200"
          : "text-white";

  return (
    <div
      className={`tile min-h-[132px] animate-rise ${toneClass}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {label}
      </div>
      <div
        className={`mt-2 text-3xl font-medium tracking-tight tabular-nums ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function Signal({
  label,
  value,
  body,
}: {
  label: string;
  value: string;
  body: string;
}) {
  return (
    <div className="card-sweep relative overflow-hidden rounded-xl border hairline bg-white/[0.015] p-4">
      <div className="relative z-10">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
          {label}
        </div>
        <div className="mt-2 text-[15px] font-medium text-white">{value}</div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--text-dim)]">
          {body}
        </p>
      </div>
    </div>
  );
}

function ActionItem({ item }: { item: ReconcileItem }) {
  const severityClass =
    item.severity === "critical"
      ? "border-rose-300/20 bg-rose-300/[0.06] text-rose-200"
      : item.severity === "review"
        ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-200"
        : "border-violet-300/20 bg-violet-300/[0.06] text-violet-200";

  const href = reconcileEvidenceHref(item);

  return (
    <Link
      href={href}
      className="block rounded-lg border hairline bg-white/[0.015] p-3 transition hover:border-[var(--border-strong)] hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[13px] text-white">{item.tag}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${severityClass}`}
        >
          {item.severity}
        </span>
      </div>
      <div className="mt-1 text-[13px] text-white/90">{item.title}</div>
      <div className="mt-1 text-[11.5px] text-[var(--text-mute)]">
        {item.owner}: {item.recommendation}
      </div>
    </Link>
  );
}

function countState(
  assets: { state: AssetState }[],
  state: AssetState,
): number {
  return assets.filter((asset) => asset.state === state).length;
}

function PageLink({
  label,
  disabled,
  params,
  page,
}: {
  label: string;
  disabled: boolean;
  params: URLSearchParams;
  page: number;
}) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return disabled ? (
    <span className="inline-flex h-9 items-center rounded-lg border hairline px-3 text-[13px] text-[var(--text-mute)]">
      {label}
    </span>
  ) : (
    <Link
      href={`/manager?${next.toString()}`}
      className="inline-flex h-9 items-center rounded-lg border border-[var(--border-strong)] bg-white/[0.02] px-3 text-[13px] text-white transition hover:bg-white/[0.05]"
    >
      {label}
    </Link>
  );
}
