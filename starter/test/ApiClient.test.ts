import { describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient } from "@/lib/api-client";

describe("api client error handling", () => {
  it("preserves structured upstream API errors", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "unknown_asset",
            message: "Asset C0009001 not found",
            details: { asset_tag: "C0009001" },
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      ),
    );
    const client = createApiClient({ baseUrl: "https://api.example/v1", fetchImpl });

    await expect(client.assets.get("C0009001")).rejects.toMatchObject({
      status: 404,
      code: "unknown_asset",
      message: "Asset C0009001 not found",
      details: { asset_tag: "C0009001" },
    } satisfies Partial<ApiError>);
  });

  it("turns non-JSON upstream failures into readable ApiErrors", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("Bad gateway from deployment edge", { status: 502 }),
    );
    const client = createApiClient({ baseUrl: "https://api.example/v1", fetchImpl });

    await expect(client.health()).rejects.toMatchObject({
      status: 502,
      code: "unknown_error",
      message: "HTTP 502: Bad gateway from deployment edge",
    } satisfies Partial<ApiError>);
  });
});
