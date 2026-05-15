import { describe, expect, it } from "vitest";
import { hasAssetEvidence, reconcileEvidenceHref } from "@/lib/reconcile-ui";
import type { ReconcileItem } from "@/lib/reconcile";

const itemBase = {
  id: "row-1",
  tag: "C0000101",
  severity: "critical",
  category: "Rack drift",
  title: "Ops and facilities disagree",
  owner: "Facilities",
  details: [],
  recommendation: "Check the rack.",
} satisfies Omit<ReconcileItem, "ops">;

describe("reconcile navigation helpers", () => {
  it("links ops-backed items to the asset detail page", () => {
    const item: ReconcileItem = {
      ...itemBase,
      ops: {
        asset_tag: "C0000101",
        state: "in_service",
        custodian: "tech-jane",
        location: {
          site: "Lab-Building-A",
          room: "Bay-12",
          row: "Aisle-3",
          rack: "B-04",
          ru: "U21",
        },
      },
    };

    expect(hasAssetEvidence(item)).toBe(true);
    expect(reconcileEvidenceHref(item)).toBe("/manager/assets/C0000101");
  });

  it("keeps external-only rows on the reconciliation page instead of linking to a 404", () => {
    const item: ReconcileItem = {
      ...itemBase,
      tag: "C9999001",
      facilities: {
        space_id: "fac-orphan",
        tagged_id: "C9999001",
        rack_location: "Lab-Building-A/Bay-12/Aisle-3/B-04/U21",
        last_observed: "2026-01-01T00:00:00.000Z",
      },
    };

    expect(hasAssetEvidence(item)).toBe(false);
    expect(reconcileEvidenceHref(item)).toBe("/manager/reconcile");
  });
});
