import { NextRequest, NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/route-errors";
import { runWorkflow, type WorkflowAction } from "@/lib/workflows";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ action: string }> },
): Promise<NextResponse> {
  const { action } = await ctx.params;
  try {
    const body = (await req.json()) as unknown;
    switch (action) {
      case "receive":
      case "store":
      case "deploy":
      case "transfer":
        return NextResponse.json(
          await runWorkflow(action as WorkflowAction, body),
        );
      default:
        return NextResponse.json(
          {
            error: {
              code: "unknown_workflow",
              message: `Unknown workflow '${action}'`,
            },
          },
          { status: 404 },
        );
    }
  } catch (error) {
    return routeErrorResponse(error, {
      code: "workflow_failed",
      message: "Workflow request failed",
    });
  }
}
