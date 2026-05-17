import type { Metadata } from "next";
import Link from "next/link";

const VIDEO_URL =
  "https://github.com/SMXFREEZE/cerebras_ai_builder_solution/releases/download/assetops-demo-v1/AssetOps_Cerebras_Loom_Walkthrough.mp4";

export const metadata: Metadata = {
  title: "AssetOps demo walkthrough",
  description:
    "Watch the AssetOps Cerebras manufacturing asset tracking walkthrough.",
};

export default function DemoPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-112px)] max-w-6xl content-center gap-8 py-8 sm:py-12">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200/80">
          Cerebras manufacturing challenge
        </p>
        <h1 className="display mt-4 text-4xl text-white sm:text-5xl">
          AssetOps product walkthrough
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          A scanner-first asset tracking system for manufacturing teams:
          technician intake, storage, deployment, custody transfer, manager
          reconciliation, asset history, and audit trails.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/12 bg-black/45 shadow-2xl shadow-sky-950/40">
        <video
          className="aspect-video w-full bg-black"
          controls
          playsInline
          preload="metadata"
        >
          <source src={VIDEO_URL} type="video/mp4" />
          Your browser cannot play this video. Open the MP4 link below.
        </video>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-black transition hover:bg-slate-200"
        >
          Open product
        </Link>
        <a
          href={VIDEO_URL}
          className="inline-flex h-11 items-center justify-center rounded-md border border-white/14 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          Open MP4
        </a>
      </div>
    </section>
  );
}
