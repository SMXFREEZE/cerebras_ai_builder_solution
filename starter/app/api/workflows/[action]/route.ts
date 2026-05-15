import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api-client";
import { runWorkflow, type WorkflowAction } from "@/lib/workflows";

function toErrorResponse(error: unknown): NextResponse {
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

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  ) {
    const structured = error as {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
    return NextResponse.json({ error: structured }, { status: 400 });
  }

  return NextResponse.json(
    {
      error: {
        code: "workflow_failed",
        message:
          error instanceof Error ? error.message : "Workflow request failed",
      },
    },
    { status: 500 },
  );
}

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
    return toErrorResponse(error);
  }
}
