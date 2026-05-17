import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-client";

type StructuredError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

function isStructuredError(error: unknown): error is StructuredError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    typeof (error as { message?: unknown }).message === "string"
  );
}

function errorBody(error: StructuredError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
}

export function routeErrorResponse(
  error: unknown,
  fallback: { code: string; message: string; status?: number },
): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      errorBody({
        code: error.code,
        message: error.message,
        details: error.details,
      }),
      { status: error.status },
    );
  }

  if (isStructuredError(error)) {
    return NextResponse.json(errorBody(error), { status: 400 });
  }

  return NextResponse.json(
    errorBody({
      code: fallback.code,
      message: error instanceof Error ? error.message : fallback.message,
    }),
    { status: fallback.status ?? 500 },
  );
}
