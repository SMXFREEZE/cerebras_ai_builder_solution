import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <section className="w-full max-w-xl rounded-xl border hairline bg-white/[0.02] p-6 sm:p-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
          404 · Not found
        </p>
        <h1 className="display mt-3 text-2xl text-white sm:text-3xl">
          This page does not exist.
        </h1>
        <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-[var(--text-dim)]">
          The route you followed points at nothing. If you scanned or typed an
          asset tag, look it up from the manager view instead.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90"
          >
            Back to home
          </Link>
          <Link
            href="/manager"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] bg-white/[0.02] px-4 text-sm text-white transition hover:bg-white/[0.05]"
          >
            Open manager view
          </Link>
        </div>
      </section>
    </div>
  );
}
