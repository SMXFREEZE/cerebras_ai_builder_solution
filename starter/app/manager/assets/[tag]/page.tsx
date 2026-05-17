import Link from "next/link";
import { StateBadge } from "@/components/StatusBadge";
import { ApiError, api } from "@/lib/api-client";
import { eventLabel, formatDateTime } from "@/lib/format";
import { locationLabel } from "@/lib/locations";
import type { Asset, Event } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ManagerAssetDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<React.ReactElement> {
  const { tag } = await params;
  let asset: Asset;
  let events: Event[];
  try {
    [asset, events] = await Promise.all([
      api.assets.get(tag),
      api.assets.history(tag),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <MissingAsset tag={tag} />;
    }
    throw error;
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/manager"
            className="text-[13px] text-[var(--text-dim)] transition hover:text-white hover:underline decoration-white/30 underline-offset-4"
          >
            Back to assets
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="display text-3xl sm:text-4xl text-white">
              {asset.asset_tag}
            </h1>
            <StateBadge state={asset.state} />
          </div>
        </div>
        <Link
          href="/manager/reconcile"
          className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90"
        >
          Reconcile
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Fact label="Serial" value={asset.serial} />
        <Fact label="Model" value={asset.model} />
        <Fact label="Class" value={asset.asset_class.replace(/_/g, " ")} />
        <Fact label="Custodian" value={asset.custodian} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-xl border hairline bg-white/[0.02] p-5">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            Current placement
          </h2>
          <div className="mt-3 text-lg font-medium text-white">
            {locationLabel(asset.location)}
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Fact label="Created" value={formatDateTime(asset.created_at)} compact />
            <Fact label="Updated" value={formatDateTime(asset.updated_at)} compact />
          </div>
        </section>
        <section className="rounded-xl border hairline bg-white/[0.02] p-5">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            Procurement note
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
            {asset.procurement_note ?? "No note attached."}
          </p>
          {asset.parent_asset_tag ? (
            <Link
              href={`/manager/assets/${asset.parent_asset_tag}`}
              className="mt-3 inline-flex text-sm font-medium text-white hover:underline decoration-white/40 underline-offset-4"
            >
              Parent {asset.parent_asset_tag}
            </Link>
          ) : null}
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border hairline bg-white/[0.015]">
        <div className="border-b hairline px-4 py-3">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            Event log
          </h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {events.map((event) => (
            <article key={event.id} className="grid gap-3 px-4 py-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <div className="font-medium text-white">
                  {eventLabel(event.event_type)}
                </div>
                <div className="text-sm text-[var(--text-mute)]">
                  {formatDateTime(event.timestamp)}
                </div>
              </div>
              <div className="text-sm text-[var(--text-dim)]">
                <div className="font-medium text-[var(--text-mute)]">User</div>
                {event.user_id}
              </div>
              <div className="text-sm text-[var(--text-dim)]">
                <div className="font-medium text-[var(--text-mute)]">State</div>
                {event.from_state ? `${event.from_state} -> ` : ""}
                {event.to_state}
              </div>
              <div className="text-sm text-[var(--text-dim)]">
                <div className="font-medium text-[var(--text-mute)]">To</div>
                {locationLabel(event.to_location)}
              </div>
            </article>
          ))}
          {!events.length ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-mute)]">
              No events recorded for this asset.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MissingAsset({ tag }: { tag: string }) {
  return (
    <div className="mx-auto max-w-2xl py-16">
      <Link
        href="/manager"
        className="text-[13px] text-[var(--text-dim)] transition hover:text-white hover:underline decoration-white/30 underline-offset-4"
      >
        Back to assets
      </Link>
      <section className="mt-5 rounded-xl border hairline bg-white/[0.02] p-6">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
          Asset detail
        </p>
        <h1 className="display mt-3 text-3xl text-white">{tag}</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--text-dim)]">
          This tag is not in operations yet. If you are testing the demo path,
          receive the asset at the dock first, then come back here for its event
          history.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/tech/receive"
            className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90"
          >
            Receive asset
          </Link>
          <Link
            href="/dev/barcodes"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] bg-white/[0.02] px-4 text-sm text-white transition hover:bg-white/[0.05]"
          >
            Open barcodes
          </Link>
        </div>
      </section>
    </div>
  );
}

function Fact({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "rounded-lg border hairline bg-white/[0.02] px-3 py-2"
          : "rounded-xl border hairline bg-white/[0.015] p-4"
      }
    >
      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {label}
      </div>
      <div className="mt-1 break-words font-medium text-white">{value}</div>
    </div>
  );
}
