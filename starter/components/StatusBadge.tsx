import type { AssetState, FinanceRecord } from "@/lib/types";
import { financeLabel, stateLabel } from "@/lib/format";

const STATE_CLASS: Record<AssetState, string> = {
  unreceived: "bg-gray-100 text-gray-700 ring-gray-200",
  received: "bg-sky-50 text-sky-700 ring-sky-200",
  stored: "bg-amber-50 text-amber-800 ring-amber-200",
  in_service: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rma_pending: "bg-violet-50 text-violet-700 ring-violet-200",
  disposed: "bg-rose-50 text-rose-700 ring-rose-200",
};

const FINANCE_CLASS: Record<FinanceRecord["status"], string> = {
  capitalized: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending_receipt: "bg-amber-50 text-amber-800 ring-amber-200",
  retired: "bg-gray-100 text-gray-700 ring-gray-200",
  impaired: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function StateBadge({ state }: { state: AssetState }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${STATE_CLASS[state]}`}
    >
      {stateLabel(state)}
    </span>
  );
}

export function FinanceBadge({
  status,
}: {
  status: FinanceRecord["status"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${FINANCE_CLASS[status]}`}
    >
      {financeLabel(status)}
    </span>
  );
}
