import { NextResponse } from "next/server";
import { buildReconcileReport } from "@/lib/reconcile";
import { routeErrorResponse } from "@/lib/route-errors";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await buildReconcileReport());
  } catch (error) {
    return routeErrorResponse(error, {
      code: "reconcile_failed",
      message: "Reconciliation failed",
    });
  }
}
