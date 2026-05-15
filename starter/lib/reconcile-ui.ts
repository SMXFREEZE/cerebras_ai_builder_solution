import type { ReconcileItem } from "./reconcile";

export function reconcileEvidenceHref(item: Pick<ReconcileItem, "ops" | "tag">): string {
  return item.ops ? `/manager/assets/${item.tag}` : "/manager/reconcile";
}

export function hasAssetEvidence(item: Pick<ReconcileItem, "ops">): boolean {
  return Boolean(item.ops);
}
