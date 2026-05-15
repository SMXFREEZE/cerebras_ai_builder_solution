import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-client";
import { buildReconcileReport } from "@/lib/reconcile";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await buildReconcileReport());
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.status },
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "reconcile_failed",
          message:
            error instanceof Error ? error.message : "Reconciliation failed",
        },
      },
      { status: 500 },
    );
  }
}
