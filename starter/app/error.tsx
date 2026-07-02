"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the underlying failure for local debugging without leaking it
    // into the UI.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <section className="w-full max-w-xl rounded-xl border border-rose-300/25 bg-rose-300/[0.045] p-6 sm:p-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-rose-200/75">
          Upstream unreachable
        </p>
        <h1 className="display mt-3 text-2xl text-white sm:text-3xl">
          The asset API is not responding.
        </h1>
        <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-[var(--text-dim)]">
          This page needs live data from the upstream asset-tracking API and
          the request failed. Nothing was written. Check that the API is
          running and reachable, then retry.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[11px] text-[var(--text-mute)]">
            digest {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90"
          >
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] bg-white/[0.02] px-4 text-sm text-white transition hover:bg-white/[0.05]"
          >
            Back to home
          </Link>
        </div>
      </section>
    </div>
  );
}
