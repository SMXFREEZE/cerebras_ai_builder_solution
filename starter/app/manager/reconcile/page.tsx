import Link from "next/link";
import { ReconcileView } from "@/components/ReconcileView";

export default function ManagerReconcilePage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Manager
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Three-way reconciliation
          </h1>
        </div>
        <Link
          href="/manager"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
        >
          Assets
        </Link>
      </div>
      <ReconcileView />
    </div>
  );
}
