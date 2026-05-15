import Link from "next/link";
import { StateBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { locationLabel } from "@/lib/locations";
import type { AssetState } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATES: Array<AssetState | ""> = [
  "",
  "received",
  "stored",
  "in_service",
  "rma_pending",
  "disposed",
];
const PAGE_SIZE = 25;

type SearchParams = Promise<{
  state?: string;
  site?: string;
  custodian?: string;
  q?: string;
  page?: string;
}>;

export default async function ManagerLandingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const state = params.state?.trim() || undefined;
  const site = params.site?.trim() || undefined;
  const custodian = params.custodian?.trim() || undefined;
  const q = params.q?.trim().toLowerCase() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const assets = await api.assets.list({ state, site, custodian });
  const filtered = q
    ? assets.filter((asset) =>
        [
          asset.asset_tag,
          asset.serial,
          asset.model,
          asset.manufacturer,
          asset.custodian,
          locationLabel(asset.location),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : assets;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const nextParams = new URLSearchParams();
  if (state) nextParams.set("state", state);
  if (site) nextParams.set("site", site);
  if (custodian) nextParams.set("custodian", custodian);
  if (q) nextParams.set("q", q);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Manager
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Asset control tower
          </h1>
        </div>
        <Link
          href="/manager/reconcile"
          className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
        >
          Reconcile
        </Link>
      </div>

      <form className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              State
            </span>
            <select
              name="state"
              defaultValue={state ?? ""}
              className="min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              {STATES.map((item) => (
                <option key={item || "all"} value={item}>
                  {item ? item.replace(/_/g, " ") : "All states"}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Site
            </span>
            <input
              name="site"
              defaultValue={site ?? ""}
              className="min-h-[44px] w-full rounded-md border border-gray-300 px-3 text-sm"
              placeholder="Lab-Building-A"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Custodian
            </span>
            <input
              name="custodian"
              defaultValue={custodian ?? ""}
              className="min-h-[44px] w-full rounded-md border border-gray-300 px-3 text-sm"
              placeholder="tech-jane"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </span>
            <input
              name="q"
              defaultValue={q}
              className="min-h-[44px] w-full rounded-md border border-gray-300 px-3 text-sm"
              placeholder="tag, serial, model, location"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="submit"
            className="min-h-[44px] rounded-md bg-gray-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
          >
            Apply
          </button>
          <Link
            href="/manager"
            className="min-h-[44px] rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Filtered" value={filtered.length.toString()} />
        <Metric label="Received" value={countState(assets, "received").toString()} />
        <Metric label="Stored" value={countState(assets, "stored").toString()} />
        <Metric
          label="In service"
          value={countState(assets, "in_service").toString()}
        />
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Custodian</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((asset) => (
                <tr key={asset.asset_tag} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      className="font-semibold text-blue-700 hover:underline"
                      href={`/manager/assets/${asset.asset_tag}`}
                    >
                      {asset.asset_tag}
                    </Link>
                    <div className="text-xs text-gray-500">{asset.serial}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StateBadge state={asset.state} />
                  </td>
                  <td className="max-w-[320px] px-4 py-3 text-gray-700">
                    {locationLabel(asset.location)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{asset.custodian}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDateTime(asset.updated_at)}
                  </td>
                </tr>
              ))}
              {!visible.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>
                    No assets match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Page {currentPage} of {pageCount}
        </span>
        <div className="flex gap-2">
          <PageLink
            label="Previous"
            disabled={currentPage <= 1}
            params={nextParams}
            page={currentPage - 1}
          />
          <PageLink
            label="Next"
            disabled={currentPage >= pageCount}
            params={nextParams}
            page={currentPage + 1}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-950">{value}</div>
    </div>
  );
}

function countState(assets: { state: AssetState }[], state: AssetState): number {
  return assets.filter((asset) => asset.state === state).length;
}

function PageLink({
  label,
  disabled,
  params,
  page,
}: {
  label: string;
  disabled: boolean;
  params: URLSearchParams;
  page: number;
}) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return disabled ? (
    <span className="rounded-md border border-gray-200 px-3 py-2 text-gray-400">
      {label}
    </span>
  ) : (
    <Link
      href={`/manager?${next.toString()}`}
      className="rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50"
    >
      {label}
    </Link>
  );
}
