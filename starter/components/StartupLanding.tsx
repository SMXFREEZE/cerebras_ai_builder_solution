"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SceneFallback } from "./SceneFallback";

const HeroScene = dynamic(
  () => import("./HeroScene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => <ScenePlaceholder />,
  },
);

const events = [
  {
    ts: "14:02:11",
    tag: "C0009001",
    action: "receive",
    loc: "DOCK-1",
    by: "tech-mike",
  },
  {
    ts: "14:02:47",
    tag: "C0009001",
    action: "store",
    loc: "STG-1 / SHELF-3",
    by: "tech-mike",
  },
  {
    ts: "14:08:03",
    tag: "C0009001",
    action: "deploy",
    loc: "BAY-12 / B-04 / U21",
    by: "tech-mike",
  },
  {
    ts: "14:14:55",
    tag: "C0009001",
    action: "transfer",
    loc: "tech-mike → tech-ana",
    by: "tech-mike",
  },
  {
    ts: "14:18:22",
    tag: "C0009104",
    action: "store",
    loc: "STG-2 / SHELF-1",
    by: "tech-ana",
  },
  {
    ts: "14:21:09",
    tag: "C0009108",
    action: "review",
    loc: "finance mismatch",
    by: "system",
  },
  {
    ts: "14:24:41",
    tag: "C0009114",
    action: "receive",
    loc: "DOCK-2",
    by: "tech-ray",
  },
  {
    ts: "14:26:02",
    tag: "C0009114",
    action: "store",
    loc: "STG-3 / SHELF-2",
    by: "tech-ray",
  },
];

const rows = [
  ["C0000101", "in_service", "BAY-12 / B-04 / U21", "tech-ana", "clean"],
  ["C0000104", "stored", "STG-1 / SHELF-3", "inventory", "clean"],
  ["C0000108", "rma_pending", "finance mismatch", "manager", "review"],
  ["C0000110", "received", "rack mismatch", "tech-mike", "critical"],
  ["C0000114", "in_service", "BAY-08 / A-02 / U14", "tech-ray", "clean"],
  ["C0000119", "stored", "STG-2 / SHELF-1", "inventory", "clean"],
  ["C0000122", "in_service", "BAY-04 / C-01 / U07", "tech-mike", "clean"],
  ["C0000128", "deploy_pend", "BAY-12 / B-05 / U03", "tech-ana", "review"],
];

const workflows = [
  {
    n: "01",
    title: "Receive",
    body: "Scan at the dock. The system creates an ops record, validates against the PO, and locks the tag to inbound state.",
    bullets: [
      "PO line matched",
      "Tag locked to RECEIVED",
      "Dock + custodian recorded",
    ],
  },
  {
    n: "02",
    title: "Store",
    body: "Move from dock to shelf. Placement is written to the facilities system in the same scan event.",
    bullets: [
      "Storage path validated",
      "Facilities row updated",
      "No finance write yet",
    ],
  },
  {
    n: "03",
    title: "Deploy",
    body: "Install into a rack. This is the only event that capitalizes the asset in finance — three writes, one scan.",
    bullets: [
      "Ops: in_service",
      "Facilities: rack assigned",
      "Finance: capitalized",
    ],
  },
  {
    n: "04",
    title: "Transfer",
    body: "Move custody between technicians. The ops record updates; facilities and finance are left alone.",
    bullets: [
      "Custody chain extended",
      "Audit event written",
      "Idempotent on replay",
    ],
  },
];

function ScenePlaceholder() {
  return (
    <div className="relative h-[420px] w-full lg:h-[520px]">
      <SceneFallback />
    </div>
  );
}

export function StartupLanding() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((c) => c + 1), 1600);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="relative -mx-4 -my-6 w-[calc(100%+2rem)] overflow-hidden bg-[#0a0a0a] text-[var(--text)]">
      <Hero />
      <LiveBoard tick={tick} />
      <WorkflowsPinned />
      <Reconcile />
      <Estate />
      <Cta />
      <Foot />
    </div>
  );
}

function Hero() {
  return (
    <section className="border-b hairline">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-28">
        <div className="max-w-2xl">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)] animate-rise">
            ops · facilities · finance — one event stream
          </div>
          <h1
            className="display mt-7 text-4xl sm:text-5xl lg:text-[68px] animate-rise"
            style={{ animationDelay: "60ms" }}
          >
            Asset records that match what&apos;s on the floor.
          </h1>
          <p
            className="mt-7 max-w-xl text-[15px] leading-relaxed text-[var(--text-dim)] sm:text-base animate-rise"
            style={{ animationDelay: "120ms" }}
          >
            AssetOps reconciles operations, facilities, and finance against the
            same scan event. No more weekly spreadsheet sweeps. No more
            deploying gear that finance hasn&apos;t capitalized.
          </p>

          <div
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] animate-rise"
            style={{ animationDelay: "180ms" }}
          >
            <Link
              href="/tech/receive"
              className="text-white underline decoration-white/30 underline-offset-[6px] hover:decoration-white"
            >
              Start scan workflow
            </Link>
            <Link
              href="/manager"
              className="text-[var(--text-dim)] hover:text-white transition"
            >
              Manager dashboard →
            </Link>
          </div>

          <dl
            className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t hairline pt-7 animate-rise"
            style={{ animationDelay: "240ms" }}
          >
            <CountStat to={4} suffix="" l="scan flows" />
            <Stat n="3-way" l="reconciliation" />
            <CountStat to={100} suffix="%" l="audit coverage" />
          </dl>
        </div>

        <div
          className="relative animate-fade"
          style={{ animationDelay: "80ms", animationDuration: "360ms" }}
        >
          <HeroScene />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-2xl font-medium tracking-tight text-white">{n}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {l}
      </div>
    </div>
  );
}

function CountStat({
  to,
  suffix,
  l,
}: {
  to: number;
  suffix: string;
  l: string;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <div>
      <div className="text-2xl font-medium tracking-tight text-white tabular-nums">
        {n}
        {suffix}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {l}
      </div>
    </div>
  );
}

function Console({ tick }: { tick: number }) {
  const window_ = 6;
  const start = tick % Math.max(1, events.length - window_ + 1);
  const visible = events.slice(start, start + window_);

  return (
    <div className="border hairline">
      <div className="flex items-center justify-between border-b hairline px-3 py-2 text-[11px] font-mono text-[var(--text-mute)]">
        <span>events.log</span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          sunnyvale-fab-2
        </span>
      </div>
      <div className="grid grid-cols-[68px_82px_70px_1fr] gap-2 border-b hairline px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-mute)]">
        <span>time</span>
        <span>tag</span>
        <span>action</span>
        <span>where</span>
      </div>
      <div className="divide-y divide-[var(--border)] font-mono text-[12px]">
        {visible.map((e, i) => (
          <div
            key={`${tick}-${i}`}
            className="console-row grid grid-cols-[68px_82px_70px_1fr] gap-2 px-3 py-2"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <span className="text-[var(--text-mute)]">{e.ts}</span>
            <span className="text-white">{e.tag}</span>
            <span
              className={
                e.action === "review"
                  ? "text-amber-300"
                  : "text-[var(--text-dim)]"
              }
            >
              {e.action}
            </span>
            <span className="truncate text-[var(--text-dim)]">{e.loc}</span>
          </div>
        ))}
      </div>
      <div className="border-t hairline px-3 py-2 text-[11px] font-mono text-[var(--text-mute)]">
        streaming · {events.length} events buffered
      </div>
    </div>
  );
}

function LiveBoard({ tick }: { tick: number }) {
  return (
    <section className="border-b hairline">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
              live · fab-2
            </div>
            <h2 className="display mt-4 text-2xl sm:text-3xl">
              Every scan, every system, one source of truth.
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-mono text-[var(--text-dim)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            streaming
          </div>
        </div>
        <div className="mt-10 grid gap-px bg-[var(--border)] md:grid-cols-[1.1fr_1fr]">
          <div className="bg-[#0a0a0a]">
            <Console tick={tick} />
          </div>
          <div className="bg-[#0a0a0a] p-6">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
              status — last 60s
            </div>
            <div className="mt-5 grid grid-cols-3 gap-px bg-[var(--border)]">
              {[
                ["clean", "41", "emerald"],
                ["review", "12", "amber"],
                ["critical", "4", "rose"],
              ].map(([l, v, c]) => (
                <div key={l} className="bg-[#0a0a0a] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-mute)]">
                    {l}
                  </div>
                  <div
                    className={
                      "mt-2 text-2xl font-medium tracking-tight " +
                      (c === "emerald"
                        ? "text-emerald-300"
                        : c === "amber"
                          ? "text-amber-300"
                          : "text-rose-300")
                    }
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 text-[12px] font-mono text-[var(--text-dim)]">
              {[
                ["receive", "DOCK-1 → DOCK-2", "2/min"],
                ["deploy", "BAY-04 / BAY-12", "0.4/min"],
                ["reconcile", "ops ↔ fin", "auto"],
              ].map(([k, w, r]) => (
                <div key={k} className="grid grid-cols-[80px_1fr_60px] gap-3">
                  <span className="text-white">{k}</span>
                  <span className="truncate text-[var(--text-mute)]">{w}</span>
                  <span className="text-right text-[var(--text-dim)]">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowsPinned() {
  return (
    <section className="border-b hairline">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
              §01 — scan flows
            </div>
            <h2 className="display mt-4 text-3xl sm:text-4xl">
              Four flows. Each one writes only what should change.
            </h2>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-[var(--text-dim)]">
            Receive, store, deploy, transfer. Every event records which of the
            three downstream systems it touches.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden border hairline bg-[var(--border)] md:grid-cols-2">
          {workflows.map((w) => (
            <article
              key={w.title}
              className="card-sweep relative bg-[#0a0a0a] p-7"
            >
              <div className="relative z-10">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[11px] text-[var(--text-mute)]">
                    {w.n}
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-mute)]">
                    flow
                  </span>
                </div>
                <h3 className="display mt-5 text-3xl text-white">{w.title}</h3>
                <p className="mt-4 max-w-md text-[14px] leading-relaxed text-[var(--text-dim)]">
                  {w.body}
                </p>
                <ul className="mt-7 divide-y divide-[var(--border)] border-y hairline">
                  {w.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-3 py-3 font-mono text-[12px] text-[var(--text-dim)]"
                    >
                      <span className="text-[var(--text-mute)]">›</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reconcile() {
  return (
    <section className="border-b hairline">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="max-w-xl">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            §02 — three-way reconcile
          </div>
          <h2 className="display mt-4 text-3xl sm:text-4xl">
            Ops vs. facilities vs. finance. Line by line.
          </h2>
          <p className="mt-5 text-[14px] leading-relaxed text-[var(--text-dim)]">
            When a row diverges across the three systems, AssetOps shows the
            delta and the last writer. Managers fix the source, not the symptom.
          </p>
          <Link
            href="/manager/reconcile"
            className="mt-7 inline-block text-[13px] text-white underline decoration-white/30 underline-offset-[6px] hover:decoration-white"
          >
            Open reconciliation
          </Link>
        </div>

        <div className="border hairline">
          <div className="grid grid-cols-4 border-b hairline">
            {["tag", "ops", "facilities", "finance"].map((h) => (
              <div
                key={h}
                className="border-r hairline px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--text-mute)] last:border-r-0"
              >
                {h}
              </div>
            ))}
          </div>
          {(
            [
              ["C0000108", "rma_pending", "BAY-12 / B-04", "—"],
              ["C0000110", "received", "—", "capitalized"],
              ["C0000128", "deploy_pend", "BAY-12 / B-05", "—"],
              ["C0000131", "in_service", "BAY-04 / C-01", "capitalized"],
              ["C0000133", "in_service", "BAY-04 / C-02", "capitalized"],
            ] as const
          ).map((r) => (
            <div
              key={r[0]}
              className="grid grid-cols-4 border-b hairline last:border-b-0 font-mono text-[12px]"
            >
              <span className="border-r hairline px-3 py-2.5 text-white">
                {r[0]}
              </span>
              <span className={cell(r[1])}>{r[1]}</span>
              <span className={cell(r[2])}>{r[2]}</span>
              <span className={cell(r[3], true)}>{r[3]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function cell(v: string, last = false) {
  const base = "px-3 py-2.5 " + (last ? "" : "border-r hairline ");
  if (v === "—") return base + "text-rose-300";
  return base + "text-[var(--text-dim)]";
}

function Estate() {
  return (
    <section className="border-b hairline">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
              §03 — live estate
            </div>
            <h2 className="display mt-4 text-3xl sm:text-4xl">
              Everything tracked. Nothing hidden.
            </h2>
          </div>
          <div className="text-[12px] text-[var(--text-mute)] font-mono">
            8 of 78 · sorted by status
          </div>
        </div>

        <div className="mt-10 border hairline">
          <div className="grid grid-cols-[110px_120px_1fr_120px_90px] gap-3 border-b hairline px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-mute)]">
            <span>tag</span>
            <span>state</span>
            <span>location</span>
            <span>custodian</span>
            <span className="text-right">status</span>
          </div>
          {rows.map((r) => (
            <div
              key={r[0]}
              className="grid grid-cols-[110px_120px_1fr_120px_90px] items-center gap-3 border-b hairline px-4 py-3 font-mono text-[12px] last:border-b-0 transition hover:bg-white/[0.015]"
            >
              <Link
                href={`/manager/assets/${r[0]}`}
                className="text-white hover:underline"
              >
                {r[0]}
              </Link>
              <span className="text-[var(--text-dim)]">{r[1]}</span>
              <span className="truncate text-[var(--text-mute)]">{r[2]}</span>
              <span className="text-[var(--text-dim)]">{r[3]}</span>
              <span
                className={
                  "text-right " +
                  (r[4] === "critical"
                    ? "text-rose-300"
                    : r[4] === "review"
                      ? "text-amber-300"
                      : "text-emerald-300")
                }
              >
                {r[4]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="border-b hairline">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <h2 className="display max-w-3xl text-4xl sm:text-5xl">
            Open the console. Scan one asset. See it propagate.
          </h2>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
            <Link
              href="/tech"
              className="text-white underline decoration-white/30 underline-offset-[6px] hover:decoration-white"
            >
              Technician console
            </Link>
            <Link
              href="/dev/barcodes"
              className="text-[var(--text-dim)] hover:text-white transition"
            >
              Print test barcodes →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Foot() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-[12px] text-[var(--text-mute)] font-mono">
        <span>AssetOps · Cerebras manufacturing</span>
        <span>
          build {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"} ·{" "}
          {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}
