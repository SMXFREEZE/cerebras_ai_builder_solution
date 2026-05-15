"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime, formatMoney } from "@/lib/format";
import { locationLabel } from "@/lib/locations";
import type { ReconcileItem, ReconcileReport, ReconcileSeverity } from "@/lib/reconcile";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; report: ReconcileReport };

const SEVERITY_CLASS: Record<ReconcileSeverity, string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-950",
  review: "border-amber-200 bg-amber-50 text-amber-950",
  watch: "border-violet-200 bg-violet-50 text-violet-950",
};

export function ReconcileView() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const res = await fetch("/api/reconcile", { cache: "no-store" });
        const data = (await res.json()) as ReconcileReport | {
          error?: { message?: string };
        };
        if (!res.ok) {
          throw new Error(
            "error" in data ? data.error?.message ?? "Reconcile failed" : "Reconcile failed",
          );
        }
        if (!cancelled) setState({ kind: "ready", report: data as ReconcileReport });
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: error instanceof Error ? error.message : "Reconcile failed",
          });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900">
        Building reconciliation report...
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
        {state.message}
      </div>
    );
  }

  const { report } = state;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Critical" value={report.summary.critical.toString()} tone="critical" />
        <Metric label="Review" value={report.summary.review.toString()} tone="review" />
        <Metric label="Watch" value={report.summary.watch.toString()} tone="watch" />
        <Metric
          label="Clean ops assets"
          value={report.totals.clean_ops_assets.toString()}
          tone="clean"
        />
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
        Generated {formatDateTime(report.generated_at)} from{" "}
        {report.totals.ops_assets} ops assets, {report.totals.facilities_rows}{" "}
        facilities rows, and {report.totals.finance_rows} finance rows.
      </div>

      <div className="space-y-3">
        {report.items.map((item) => (
          <ReconcileCard key={item.id} item={item} />
        ))}
        {!report.items.length ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-6 text-center text-sm font-semibold text-emerald-900">
            No reconciliation issues found.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: ReconcileSeverity | "clean";
}) {
  const toneClass =
    tone === "clean"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : SEVERITY_CLASS[tone];
  return (
    <div className={`rounded-md border p-4 shadow-sm ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-75">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ReconcileCard({ item }: { item: ReconcileItem }) {
  return (
    <article
      className={`rounded-md border p-4 shadow-sm ${SEVERITY_CLASS[item.severity]}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
              {item.severity}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide opacity-75">
              {item.category}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
          <div className="mt-1 text-sm opacity-80">Owner: {item.owner}</div>
        </div>
        <Link
          href={`/manager/assets/${item.tag}`}
          className="rounded-md bg-white/80 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-white"
        >
          {item.tag}
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SystemBox
          title="Ops"
          rows={
            item.ops
              ? [
                  ["State", item.ops.state],
                  ["Custodian", item.ops.custodian],
                  ["Location", locationLabel(item.ops.location)],
                ]
              : [["Status", "Missing"]]
          }
        />
        <SystemBox
          title="Facilities"
          rows={
            item.facilities
              ? [
                  ["Rack", item.facilities.rack_location],
                  ["Observed", formatDateTime(item.facilities.last_observed)],
                ]
              : [["Status", "Missing"]]
          }
        />
        <SystemBox
          title="Finance"
          rows={
            item.finance
              ? [
                  ["Status", item.finance.status],
                  ["Site", item.finance.site],
                  ["Book", formatMoney(item.finance.book_value_usd)],
                ]
              : [["Status", "Missing"]]
          }
        />
      </div>

      <ul className="mt-4 space-y-1 text-sm">
        {item.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
      <div className="mt-3 rounded-md bg-white/70 p-3 text-sm font-medium text-gray-950">
        {item.recommendation}
      </div>
    </article>
  );
}

function SystemBox({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-md bg-white/75 p-3 text-gray-950 ring-1 ring-inset ring-black/10">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <dl className="mt-2 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="break-words font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
