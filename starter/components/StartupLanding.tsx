"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import gsap from "gsap";

const scanEvents = [
  {
    tag: "C0009001",
    action: "Receive",
    location: "Dock 1",
    result: "Ops asset created",
  },
  {
    tag: "C0009001",
    action: "Store",
    location: "Storage-1 / Shelf-3",
    result: "Inventory placement verified",
  },
  {
    tag: "C0009001",
    action: "Deploy",
    location: "Bay-12 / Rack B-04 / U21",
    result: "Facilities + finance updated",
  },
  {
    tag: "C0009001",
    action: "Transfer",
    location: "tech-mike -> tech-ana",
    result: "Custody event recorded",
  },
];

const floatingAssets = [
  { tag: "C0009001", state: "in service", owner: "tech-ana", delay: 0 },
  { tag: "C0009418", state: "stored", owner: "inventory", delay: 0.4 },
  { tag: "C0008772", state: "review", owner: "manager", delay: 0.8 },
];

const dashboardRows = [
  ["C0009001", "In service", "Rack B-04 / U21", "clean"],
  ["C0009418", "Stored", "Shelf-3", "clean"],
  ["C0008772", "RMA pending", "Finance mismatch", "review"],
  ["C0008120", "Received", "Missing rack handoff", "critical"],
];

const workflowLinks = [
  {
    href: "/tech/receive",
    title: "Technician scan workflow",
    copy: "Receive, store, deploy, and transfer assets with keyboard scanner speed and optional camera capture.",
  },
  {
    href: "/manager",
    title: "Manager dashboard",
    copy: "Filter the live asset estate by state, site, custodian, model, and exception status.",
  },
  {
    href: "/manager/reconcile",
    title: "Reconciliation view",
    copy: "Compare operations, facilities, and finance records before gaps become manufacturing blockers.",
  },
  {
    href: "/manager/assets/C0009001",
    title: "Asset detail page",
    copy: "Drill into placement, procurement context, custody, and full event history for one asset.",
  },
];

const storySections = [
  {
    title: "Scan at the edge",
    copy: "Technicians move as fast as the line. Every scan is short, resilient, and built around the hardware path they already use.",
    metric: "4",
    label: "core scan flows",
  },
  {
    title: "Write to the systems that matter",
    copy: "Deployments bridge ops, facilities, and finance only when the asset is truly in service, keeping the handoff auditable.",
    metric: "3",
    label: "systems reconciled",
  },
  {
    title: "Give managers the truth fast",
    copy: "The control tower surfaces critical mismatches first, then gives the detail and audit trail needed to resolve them.",
    metric: "0",
    label: "guesswork required",
  },
];

const auditEvents = [
  "Receive scan accepted at Dock 1",
  "Stored in Lab-Building-A / Storage-1",
  "Deployed to Bay-12 / B-04 / U21",
  "Facilities rack record written",
  "Finance capitalization written",
  "Custody transferred to tech-ana",
];

type ScanEvent = (typeof scanEvents)[number];

export function StartupLanding() {
  const [scanIndex, setScanIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroLift = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const cloudShift = useTransform(scrollYProgress, [0, 1], [0, -70]);

  const headlineWords = useMemo(
    () => "Manufacturing assets, tracked at line speed.".split(" "),
    [],
  );
  const activeScan = scanEvents[scanIndex % scanEvents.length] ?? scanEvents[0]!;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setScanIndex((current) => current + 1);
    }, 1850);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!headlineRef.current) return;
    const words = headlineRef.current.querySelectorAll("[data-gsap-word]");
    gsap.fromTo(
      words,
      { autoAlpha: 0, y: 18, filter: "blur(2px)" },
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.52,
        ease: "power3.out",
        stagger: 0.035,
      },
    );
  }, []);

  return (
    <div className="relative mx-[calc(50%-50vw)] -my-6 min-h-screen overflow-hidden bg-[#05070d] text-white">
      <motion.div
        aria-hidden="true"
        style={{ y: cloudShift }}
        className="premium-cloud pointer-events-none absolute inset-x-0 top-0 h-[820px]"
      />
      <div aria-hidden="true" className="premium-grid pointer-events-none absolute inset-0" />
      <HeroSection
        refTarget={heroRef}
        headlineRef={headlineRef}
        headlineWords={headlineWords}
        heroLift={heroLift}
        activeScan={activeScan}
      />
      <ProductStrip />
      <StorySections />
      <DashboardSection />
      <WorkflowSection />
      <FinalCta />
    </div>
  );
}

function HeroSection({
  refTarget,
  headlineRef,
  headlineWords,
  heroLift,
  activeScan,
}: {
  refTarget: React.RefObject<HTMLDivElement | null>;
  headlineRef: React.RefObject<HTMLHeadingElement | null>;
  headlineWords: string[];
  heroLift: MotionValue<number>;
  activeScan: ScanEvent;
}) {
  return (
    <section
      ref={refTarget}
      className="relative flex min-h-[760px] items-center px-4 py-16 sm:px-8 lg:min-h-[760px] lg:px-12"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_560px]">
        <motion.div
          style={{ y: heroLift }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <h1
            ref={headlineRef}
            className="max-w-4xl text-balance text-5xl font-semibold leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl"
          >
            {headlineWords.map((word) => (
              <span
                key={word}
                data-gsap-word
                className="mr-[0.18em] inline-block will-change-transform"
              >
                {word}
              </span>
            ))}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            A premium command layer for Cerebras manufacturing teams: scan assets
            in seconds, reconcile ops with facilities and finance, and turn every
            movement into an audit-ready event.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tech/receive"
              className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(255,255,255,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              Start scan workflow
            </Link>
            <Link
              href="/manager"
              className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-300/10"
            >
              Open control tower
            </Link>
          </div>
          <div className="mt-10 hidden max-w-2xl gap-3 sm:grid sm:grid-cols-3">
            <HeroMetric value="4" label="scan flows" />
            <HeroMetric value="3-way" label="reconciliation" />
            <HeroMetric value="audit" label="every movement" />
          </div>
        </motion.div>
        <HeroConsole activeScan={activeScan} />
      </div>
    </section>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function HeroConsole({ activeScan }: { activeScan: ScanEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.15, duration: 0.8, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-[560px]"
    >
      <div className="absolute -inset-6 rounded-[2rem] bg-cyan-400/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="text-sm font-semibold text-white">AssetOps live</div>
            <div className="mt-1 text-xs text-slate-400">Sunnyvale factory floor</div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
            synced
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
            <div className="relative min-h-[216px] overflow-hidden rounded-lg border border-white/10 bg-[#050b13] p-4">
              <div className="scan-beam absolute inset-x-4 top-5 h-px bg-cyan-200" />
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                live scan
              </div>
              <div className="mt-8 font-mono text-3xl font-semibold tracking-normal text-white">
                {activeScan.tag}
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <ScanLine label="Action" value={activeScan.action} />
                <ScanLine label="Location" value={activeScan.location} />
                <ScanLine label="Result" value={activeScan.result} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {floatingAssets.map((asset) => (
              <motion.div
                key={asset.tag}
                animate={{ y: [-4, 6, -4] }}
                transition={{
                  duration: 4.4,
                  delay: asset.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-semibold text-white">
                    {asset.tag}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-100">
                    {asset.state}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400">{asset.owner}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ScanLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md bg-white/[0.04] px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-100">{value}</span>
    </div>
  );
}

function ProductStrip() {
  return (
    <section className="relative border-y border-white/10 bg-white/[0.03] px-4 py-5 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <span className="font-semibold text-white">Built for the challenge surface</span>
        <div className="flex flex-wrap gap-3">
          {["Technician scans", "Manager dashboard", "Reconciliation", "Audit trail"].map(
            (item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1"
              >
                {item}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function StorySections() {
  return (
    <section id="story" className="relative px-4 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Reveal>
            <h2 className="max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              The factory floor gets a system of record that can keep up.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              The product story stays simple: scan where work happens, write only
              the records that should change, and give leaders a command view of
              exceptions before they slow down manufacturing.
            </p>
          </Reveal>
        </div>
        <div className="space-y-5">
          {storySections.map((section, index) => (
            <Reveal key={section.title} delay={index * 0.08}>
              <article className="min-h-[280px] rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{section.title}</h3>
                    <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
                      {section.copy}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-4xl font-semibold text-cyan-200">
                      {section.metric}
                    </div>
                    <div className="mt-1 max-w-24 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {section.label}
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardSection() {
  return (
    <section id="dashboard" className="relative px-4 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <DashboardPreview />
        </Reveal>
        <Reveal delay={0.08}>
          <div className="max-w-xl">
            <h2 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              A control tower that sells the product in one glance.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              The manager view prioritizes action: critical mismatches, review
              queue, clean assets, filtered table, and direct drill-down to
              asset detail. It looks polished, but it is still the real challenge
              app underneath.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/manager"
                className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-cyan-200 px-5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-white"
              >
                View dashboard
              </Link>
              <Link
                href="/manager/reconcile"
                className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Open reconciliation
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-cyan-950/30">
      <div className="border-b border-white/10 bg-white/[0.04] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">Manager control tower</div>
            <div className="mt-1 text-xs text-slate-500">
              filtered estate / first actions / audit trail
            </div>
          </div>
          <div className="rounded-md bg-rose-300/15 px-3 py-2 text-xs font-semibold text-rose-100">
            4 critical
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-4">
        {[
          ["Filtered", "25"],
          ["Critical", "4"],
          ["Review", "12"],
          ["Clean", "41"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>
      <div className="px-5 pb-5">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          {dashboardRows.map((row, index) => (
            <motion.div
              key={row[0]}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: [0.72, 1, 0.72] }}
              transition={{
                duration: 3.2,
                delay: index * 0.28,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="grid min-w-[620px] grid-cols-[96px_100px_minmax(140px,1fr)_76px] items-center gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-mono font-semibold text-white">{row[0]}</span>
              <span className="text-slate-300">{row[1]}</span>
              <span className="truncate text-slate-500">{row[2]}</span>
              <span
                className={
                  row[3] === "critical"
                    ? "rounded-full bg-rose-300/15 px-2 py-1 text-center text-xs font-semibold text-rose-100"
                    : row[3] === "review"
                      ? "rounded-full bg-amber-300/15 px-2 py-1 text-center text-xs font-semibold text-amber-100"
                      : "rounded-full bg-emerald-300/15 px-2 py-1 text-center text-xs font-semibold text-emerald-100"
                }
              >
                {row[3]}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkflowSection() {
  return (
    <section id="product" className="relative px-4 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              The impressive surface still opens the real product.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Every major requirement is one click away, from scan workflows to
              reconciliation and asset audit history.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {workflowLinks.map((item, index) => (
            <Reveal key={item.href} delay={index * 0.06}>
              <Link
                href={item.href}
                className="group block min-h-[220px] rounded-2xl border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-cyan-200/40 hover:bg-cyan-200/[0.07]"
              >
                <div className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
                      {item.copy}
                    </p>
                  </div>
                  <div className="inline-flex items-center text-sm font-semibold text-cyan-200">
                    Open surface
                    <span className="ml-2 transition group-hover:translate-x-1">-&gt;</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative px-4 pb-24 pt-10 sm:px-8 lg:px-12">
      <Reveal>
        <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur lg:grid-cols-[1fr_420px] lg:p-10">
          <div>
            <h2 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Ready for manufacturing review, not just a demo screen.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Scan events, state transitions, writebacks, reconciliation, asset
              detail, and audit history all remain connected to the challenge API.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tech"
                className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100"
              >
                Enter technician console
              </Link>
              <Link
                href="/dev/barcodes"
                className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Print test barcodes
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
            <div className="text-sm font-semibold text-white">Audit trail</div>
            <div className="mt-4 space-y-3">
              {auditEvents.map((event, index) => (
                <motion.div
                  key={event}
                  initial={{ opacity: 0.86, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                  className="flex items-center gap-3 rounded-md bg-white/[0.04] px-3 py-2 text-sm text-slate-300"
                >
                  <span className="h-2 w-2 rounded-full bg-cyan-200" />
                  {event}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.86, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
