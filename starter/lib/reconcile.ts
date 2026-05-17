import { api } from "./api-client";
import { locationLabel, locationToRackString } from "./locations";
import type { Asset, FacilitiesRecord, FinanceRecord } from "./types";

export type ReconcileSeverity = "critical" | "review" | "watch";

export type ReconcileItem = {
  id: string;
  tag: string;
  severity: ReconcileSeverity;
  category: string;
  title: string;
  owner: "Operations" | "Facilities" | "Finance" | "Cross-functional";
  details: string[];
  recommendation: string;
  ops?: Pick<Asset, "asset_tag" | "state" | "custodian" | "location">;
  facilities?: FacilitiesRecord;
  finance?: FinanceRecord;
};

export type ReconcileReport = {
  generated_at: string;
  totals: {
    ops_assets: number;
    facilities_rows: number;
    finance_rows: number;
    clean_ops_assets: number;
  };
  summary: Record<ReconcileSeverity, number>;
  items: ReconcileItem[];
};

type DraftItem = Omit<ReconcileItem, "id">;

const SEVERITY_RANK: Record<ReconcileSeverity, number> = {
  critical: 0,
  review: 1,
  watch: 2,
};

function sameRack(left: string | null, right: string | null): boolean {
  return normalizeRack(left) === normalizeRack(right);
}

function normalizeRack(value: string | null): string {
  return (value ?? "").toUpperCase().replace(/\s+/g, "");
}

function opsSnapshot(asset: Asset): ReconcileItem["ops"] {
  return {
    asset_tag: asset.asset_tag,
    state: asset.state,
    custodian: asset.custodian,
    location: asset.location,
  };
}

function add(
  list: DraftItem[],
  item: DraftItem,
): void {
  list.push(item);
}

function classifyKnownAsset(
  asset: Asset,
  facilities: FacilitiesRecord | undefined,
  finance: FinanceRecord | undefined,
): DraftItem[] {
  const items: DraftItem[] = [];
  const expectedRack =
    asset.state === "in_service" ? locationToRackString(asset.location) : null;

  if (asset.state === "in_service") {
    if (!facilities) {
      add(items, {
        tag: asset.asset_tag,
        severity: "critical",
        category: "Missing facilities row",
        title: "In-service asset has no rack assignment",
        owner: "Facilities",
        details: [
          `Ops location is ${locationLabel(asset.location)}.`,
          "Facilities has no matching tagged space.",
        ],
        recommendation: "Write the rack assignment to facilities or rescan deploy.",
        ops: opsSnapshot(asset),
        finance,
      });
    } else if (!sameRack(expectedRack, facilities.rack_location)) {
      add(items, {
        tag: asset.asset_tag,
        severity: "critical",
        category: "Rack drift",
        title: "Ops and facilities disagree on rack location",
        owner: "Cross-functional",
        details: [
          `Ops says ${expectedRack ?? "no deploy rack"}.`,
          `Facilities says ${facilities.rack_location}.`,
        ],
        recommendation: "Ask the floor tech to confirm the rack, then update the stale system.",
        ops: opsSnapshot(asset),
        facilities,
        finance,
      });
    }

    if (!finance || finance.status !== "capitalized") {
      add(items, {
        tag: asset.asset_tag,
        severity: "critical",
        category: "Missing capitalization",
        title: "In-service asset is not capitalized in finance",
        owner: "Finance",
        details: [
          finance
            ? `Finance status is ${finance.status}.`
            : "Finance has no matching equipment row.",
          `Ops site is ${asset.location.site}.`,
        ],
        recommendation: "Create or update the finance equipment row after deploy.",
        ops: opsSnapshot(asset),
        facilities,
        finance,
      });
    }
  }

  if (asset.state !== "in_service" && facilities) {
    const severity: ReconcileSeverity =
      asset.state === "disposed" ? "critical" : "review";
    add(items, {
      tag: asset.asset_tag,
      severity,
      category:
        asset.state === "disposed"
          ? "Disposed still racked"
          : "Facilities row should be cleared",
      title:
        asset.state === "disposed"
          ? "Disposed asset still appears in facilities"
          : "Non-deployed asset still appears in facilities",
      owner: "Facilities",
      details: [
        `Ops state is ${asset.state}.`,
        `Facilities rack is ${facilities.rack_location}.`,
      ],
      recommendation:
        asset.state === "rma_pending"
          ? "Confirm whether the item is physically in RMA staging or still on the floor."
          : "Clear the facilities rack row unless a deploy scan is missing.",
      ops: opsSnapshot(asset),
      facilities,
      finance,
    });
  }

  if (asset.state === "disposed" && finance?.status === "capitalized") {
    add(items, {
      tag: asset.asset_tag,
      severity: "critical",
      category: "Retirement drift",
      title: "Disposed asset is still capitalized",
      owner: "Finance",
      details: [
        `Finance status is ${finance.status}.`,
        `Book value is ${finance.book_value_usd}.`,
      ],
      recommendation: "Review disposal paperwork and retire or impair the equipment row.",
      ops: opsSnapshot(asset),
      facilities,
      finance,
    });
  }

  if (asset.state === "rma_pending" && finance?.status === "capitalized") {
    add(items, {
      tag: asset.asset_tag,
      severity: "watch",
      category: "RMA finance watch",
      title: "RMA asset remains capitalized",
      owner: "Finance",
      details: [
        `Ops location is ${locationLabel(asset.location)}.`,
        "This may be correct, but should stay visible while RMA is open.",
      ],
      recommendation: "Keep capitalized if recoverable; impair only after RMA decision.",
      ops: opsSnapshot(asset),
      facilities,
      finance,
    });
  }

  if (finance && finance.site !== asset.location.site) {
    add(items, {
      tag: asset.asset_tag,
      severity: "review",
      category: "Finance site mismatch",
      title: "Finance site does not match ops site",
      owner: "Finance",
      details: [
        `Ops site is ${asset.location.site}.`,
        `Finance site is ${finance.site}.`,
      ],
      recommendation: "Update finance site if the latest physical scan is trusted.",
      ops: opsSnapshot(asset),
      facilities,
      finance,
    });
  }

  return items;
}

function classifyExternalOnly(
  tag: string,
  facilities: FacilitiesRecord | undefined,
  finance: FinanceRecord | undefined,
): DraftItem[] {
  const items: DraftItem[] = [];

  if (facilities) {
    add(items, {
      tag,
      severity: "critical",
      category: "Facilities orphan",
      title: "Facilities has a rack row for a tag missing from ops",
      owner: "Facilities",
      details: [`Facilities rack is ${facilities.rack_location}.`],
      recommendation: "Confirm the tag on the floor; receive it into ops or clear the rack row.",
      facilities,
      finance,
    });
  }

  if (finance) {
    add(items, {
      tag,
      severity: finance.status === "pending_receipt" ? "review" : "critical",
      category:
        finance.status === "pending_receipt"
          ? "Pending receipt"
          : "Finance orphan",
      title:
        finance.status === "pending_receipt"
          ? "Finance expects an asset that ops has not received"
          : "Finance has equipment missing from ops",
      owner: "Finance",
      details: [
        `Finance status is ${finance.status}.`,
        `Finance site is ${finance.site}.`,
      ],
      recommendation:
        finance.status === "pending_receipt"
          ? "Check receiving backlog before escalating."
          : "Reconcile finance master data against physical inventory.",
      facilities,
      finance,
    });
  }

  return items;
}

export async function buildReconcileReport(): Promise<ReconcileReport> {
  const [assets, facilities, finance] = await Promise.all([
    api.assets.list(),
    api.mock.facilities(),
    api.mock.finance(),
  ]);

  const assetsByTag = new Map(assets.map((asset) => [asset.asset_tag, asset]));
  const facilitiesByTag = new Map(
    facilities.map((record) => [record.tagged_id, record]),
  );
  const financeByTag = new Map(finance.map((record) => [record.tag, record]));
  const allTags = new Set([
    ...assetsByTag.keys(),
    ...facilitiesByTag.keys(),
    ...financeByTag.keys(),
  ]);

  const drafts: DraftItem[] = [];
  let cleanOpsAssets = 0;

  for (const tag of allTags) {
    const asset = assetsByTag.get(tag);
    const facility = facilitiesByTag.get(tag);
    const financeRecord = financeByTag.get(tag);
    const before = drafts.length;

    if (asset) {
      drafts.push(...classifyKnownAsset(asset, facility, financeRecord));
      if (drafts.length === before) cleanOpsAssets += 1;
    } else {
      drafts.push(...classifyExternalOnly(tag, facility, financeRecord));
    }
  }

  const items = drafts
    .map((item, index) => ({
      ...item,
      id: `${item.tag}-${item.category.replace(/\s+/g, "-").toLowerCase()}-${index}`,
    }))
    .sort((a, b) => {
      const severityDelta = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (severityDelta !== 0) return severityDelta;
      return a.tag.localeCompare(b.tag);
    });

  const summary: Record<ReconcileSeverity, number> = {
    critical: 0,
    review: 0,
    watch: 0,
  };
  for (const item of items) {
    summary[item.severity] += 1;
  }

  return {
    generated_at: new Date().toISOString(),
    totals: {
      ops_assets: assets.length,
      facilities_rows: facilities.length,
      finance_rows: finance.length,
      clean_ops_assets: cleanOpsAssets,
    },
    summary,
    items,
  };
}
