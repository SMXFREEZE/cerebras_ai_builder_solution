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

const SEVERITY_RING: Record<ReconcileSeverity, string> = {
  critical: "border-rose-300/25 bg-rose-300/[0.04]",
  review: "border-amber-300/25 bg-amber-300/[0.04]",
  watch: "border-violet-300/25 bg-violet-300/[0.04]",
};

const SEVERITY_TEXT: Record<ReconcileSeverity, string> = {
  critical: "text-rose-200",
  review: "text-amber-200",
  watch: "text-violet-200",
};

const SEVERITY_LABEL: Record<ReconcileSeverity, string> = {
  critical: "Fix today",
  review: "Needs a human",
  watch: "Probably fine",
};

export function ReconcileView() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const res = await fetch("/api/reconcile", { cache: "no-store" });
        const data = (await res.json()) as ReconcileReport | { error?: { message?: string } };
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
      <div className="flex items-center gap-3 rounded-xl border hairline bg-white/[0.02] px-5 py-4 text-[14px] text-[var(--text-dim)]">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
        Pulling ops, facilities, and finance…
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-xl border border-rose-300/25 bg-rose-300/[0.04] p-5 text-[14px] text-rose-100">
        <div className="font-medium">{state.message}</div>
        <div className="mt-1 text-[12px] text-[var(--text-mute)]">
          The reconcile route lives at <code className="font-mono">/api/reconcile</code>. Check the server log.
        </div>
      </div>
    );
  }

  const { report } = state;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Critical" sub="ops & writeback drift" value={report.summary.critical.toString()} tone="critical" delay={0} />
        <Metric label="Review" sub="needs a human" value={report.summary.review.toString()} tone="review" delay={60} />
        <Metric label="Watch" sub="explainable difference" value={report.summary.watch.toString()} tone="watch" delay={120} />
        <Metric label="Clean" sub="ops assets reconciled" value={report.totals.clean_ops_assets.toString()} tone="clean" delay={180} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[var(--text-mute)]">
        <span>
          Generated <span className="font-mono text-[var(--text-dim)]">{formatDateTime(report.generated_at)}</span> from{" "}
          <span className="font-mono text-[var(--text-dim)]">{report.totals.ops_assets}</span> ops,{" "}
          <span className="font-mono text-[var(--text-dim)]">{report.totals.facilities_rows}</span> facilities, and{" "}
          <span className="font-mono text-[var(--text-dim)]">{report.totals.finance_rows}</span> finance rows.
        </span>
        <span className="font-mono">{report.items.length} items</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <LegendItem
          tone="critical"
          title="Fix today"
          body="A physical location or finance status disagrees with operations."
        />
        <LegendItem
          tone="review"
          title="Needs a human"
          body="The row may be lag, policy, or a missing scan; it needs owner context."
        />
        <LegendItem
          tone="watch"
          title="Probably fine"
          body="The systems differ because their scopes are intentionally different."
        />
      </div>

      <div className="space-y-3">
        {report.items.map((item) => (
          <ReconcileCard key={item.id} item={item} />
        ))}
        {!report.items.length ? (
          <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/[0.04] p-8 text-center">
            <div className="text-[15px] font-medium text-emerald-100">All three systems agree.</div>
            <div className="mt-1 text-[12px] text-[var(--text-mute)]">Nothing here. Reset the API to repopulate drift cases.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LegendItem({
  tone,
  title,
  body,
}: {
  tone: ReconcileSeverity;
  title: string;
  body: string;
}) {
  const toneClass =
    tone === "critical"
      ? "border-rose-300/20 bg-rose-300/[0.035]"
      : tone === "review"
        ? "border-amber-300/20 bg-amber-300/[0.035]"
        : "border-violet-300/20 bg-violet-300/[0.035]";
  const dotClass =
    tone === "critical"
      ? "bg-rose-300"
      : tone === "review"
        ? "bg-amber-300"
        : "bg-violet-300";

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        <div className="text-[13px] font-medium text-white">{title}</div>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-dim)]">{body}</p>
    </div>
  );
}

function Metric({
  label,
  sub,
  value,
  tone,
  delay,
}: {
  label: string;
  sub: string;
  value: string;
  tone: ReconcileSeverity | "clean";
  delay: number;
}) {
  const toneClass = tone === "clean" ? "tile-clean" : tone === "critical" ? "tile-critical" : tone === "review" ? "tile-review" : "";
  const valueClass =
    tone === "critical"
      ? "text-rose-200"
      : tone === "review"
        ? "text-amber-200"
        : tone === "watch"
          ? "text-violet-200"
          : "text-emerald-200";

  return (
    <div className={`tile animate-rise ${toneClass}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">{label}</div>
      <div className={`mt-2 text-3xl font-medium tracking-tight tabular-nums ${valueClass}`}>{value}</div>
      <div className="mt-1 text-[11px] text-[var(--text-mute)]">{sub}</div>
    </div>
  );
}

function ReconcileCard({ item }: { item: ReconcileItem }) {
  return (
    <article className={`rounded-xl border p-5 ${SEVERITY_RING[item.severity]}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                item.severity === "critical"
                  ? "border-rose-300/30 bg-rose-300/[0.08] text-rose-100"
                  : item.severity === "review"
                    ? "border-amber-300/30 bg-amber-300/[0.08] text-amber-100"
                    : "border-violet-300/30 bg-violet-300/[0.08] text-violet-100"
              }`}
            >
              {SEVERITY_LABEL[item.severity]}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--text-mute)]">
              {item.category}
            </span>
          </div>
          <h2 className={`mt-3 text-[17px] font-medium tracking-tight ${SEVERITY_TEXT[item.severity]}`}>
            {item.title}
          </h2>
          <div className="mt-1 text-[12px] text-[var(--text-mute)]">Owner: {item.owner}</div>
        </div>
        <Link
          href={`/manager/assets/${item.tag}`}
          className="inline-flex h-9 items-center rounded-lg border border-[var(--border-strong)] bg-white/[0.02] px-3 font-mono text-[13px] text-white transition hover:bg-white/[0.05]"
        >
          {item.tag} →
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SystemBox
          title="Ops"
          rows={
            item.ops
              ? [
                  ["state", item.ops.state],
                  ["custodian", item.ops.custodian],
                  ["location", locationLabel(item.ops.location)],
                ]
              : [["status", "missing"]]
          }
          missing={!item.ops}
        />
        <SystemBox
          title="Facilities"
          rows={
            item.facilities
              ? [
                  ["rack", item.facilities.rack_location],
                  ["observed", formatDateTime(item.facilities.last_observed)],
                ]
              : [["status", "missing"]]
          }
          missing={!item.facilities}
        />
        <SystemBox
          title="Finance"
          rows={
            item.finance
              ? [
                  ["status", item.finance.status],
                  ["site", item.finance.site],
                  ["book value", formatMoney(item.finance.book_value_usd)],
                ]
              : [["status", "missing"]]
          }
          missing={!item.finance}
        />
      </div>

      {item.details.length ? (
        <ul className="mt-5 divide-y divide-[var(--border)] border-y hairline">
          {item.details.map((detail) => (
            <li key={detail} className="flex items-start gap-3 py-2.5 font-mono text-[12.5px] text-[var(--text-dim)]">
              <span className="text-[var(--text-mute)]">›</span>
              {detail}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 rounded-lg border hairline bg-white/[0.02] p-3.5">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
          Recommendation
        </div>
        <div className="mt-1 text-[13.5px] text-white">{item.recommendation}</div>
      </div>
    </article>
  );
}

function SystemBox({
  title,
  rows,
  missing,
}: {
  title: string;
  rows: Array<[string, string]>;
  missing?: boolean;
}) {
  return (
    <div className={`rounded-lg border hairline p-3.5 ${missing ? "bg-rose-300/[0.03]" : "bg-white/[0.015]"}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
          {title}
        </div>
        {missing ? (
          <span className="rounded-full border border-rose-300/25 bg-rose-300/[0.06] px-2 py-0.5 text-[10px] text-rose-200">
            missing
          </span>
        ) : null}
      </div>
      <dl className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-mute)]">{label}</dt>
            <dd className={`mt-0.5 break-words text-[13px] ${missing ? "text-rose-100" : "text-white"}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
