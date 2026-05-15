import Link from "next/link";
import { StateBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api-client";
import { eventLabel, formatDateTime } from "@/lib/format";
import { locationLabel } from "@/lib/locations";

export const dynamic = "force-dynamic";

export default async function ManagerAssetDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<React.ReactElement> {
  const { tag } = await params;
  const [asset, events] = await Promise.all([
    api.assets.get(tag),
    api.assets.history(tag),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/manager"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Back to assets
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-950">
              {asset.asset_tag}
            </h1>
            <StateBadge state={asset.state} />
          </div>
        </div>
        <Link
          href="/manager/reconcile"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
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
        <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Current placement
          </h2>
          <div className="mt-3 text-lg font-semibold text-gray-950">
            {locationLabel(asset.location)}
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Fact label="Created" value={formatDateTime(asset.created_at)} compact />
            <Fact label="Updated" value={formatDateTime(asset.updated_at)} compact />
          </div>
        </section>
        <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Procurement note
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-700">
            {asset.procurement_note ?? "No note attached."}
          </p>
          {asset.parent_asset_tag ? (
            <Link
              href={`/manager/assets/${asset.parent_asset_tag}`}
              className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:underline"
            >
              Parent {asset.parent_asset_tag}
            </Link>
          ) : null}
        </section>
      </div>

      <section className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Event log
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {events.map((event) => (
            <article key={event.id} className="grid gap-3 px-4 py-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <div className="font-semibold text-gray-950">
                  {eventLabel(event.event_type)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDateTime(event.timestamp)}
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <div className="font-medium text-gray-500">User</div>
                {event.user_id}
              </div>
              <div className="text-sm text-gray-700">
                <div className="font-medium text-gray-500">State</div>
                {event.from_state ? `${event.from_state} -> ` : ""}
                {event.to_state}
              </div>
              <div className="text-sm text-gray-700">
                <div className="font-medium text-gray-500">To</div>
                {locationLabel(event.to_location)}
              </div>
            </article>
          ))}
          {!events.length ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No events recorded for this asset.
            </div>
          ) : null}
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
          ? "rounded-md bg-gray-50 px-3 py-2"
          : "rounded-md border border-gray-200 bg-white p-4 shadow-sm"
      }
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 break-words font-semibold text-gray-950">{value}</div>
    </div>
  );
}
