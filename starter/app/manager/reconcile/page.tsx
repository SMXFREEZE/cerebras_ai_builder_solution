import Link from "next/link";
import { ReconcileView } from "@/components/ReconcileView";

export default function ManagerReconcilePage() {
  return (
    <div className="space-y-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            Manager
          </p>
          <h1 className="display mt-3 text-3xl sm:text-4xl">Three-way reconciliation</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--text-dim)]">
            Ops, facilities, and finance, side by side. Items are sorted by what needs a human first — critical drift before review queue before quiet differences.
          </p>
        </div>
        <Link
          href="/manager"
          className="inline-flex h-9 items-center rounded-lg border border-[var(--border-strong)] bg-white/[0.02] px-3 text-[13px] text-[var(--text-dim)] transition hover:bg-white/[0.05] hover:text-white"
        >
          ← Asset list
        </Link>
      </header>
      <ReconcileView />
    </div>
  );
}
