import { NextRequest, NextResponse } from "next/server";
import { ApiError, api } from "@/lib/api-client";
import { locationToRackString } from "@/lib/locations";
import type {
  Asset,
  DeployScanInput,
  FinanceRecord,
  ReceiveScanInput,
  StoreScanInput,
  TransferScanInput,
} from "@/lib/types";

type WorkflowResult = {
  asset: Asset;
  message: string;
  sideEffects?: string[];
};

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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function findFinance(finance: FinanceRecord[], tag: string): FinanceRecord | null {
  return finance.find((record) => record.tag === tag) ?? null;
}

async function receive(body: ReceiveScanInput): Promise<WorkflowResult> {
  const asset = await api.scans.receive(body);
  return {
    asset,
    message: `${asset.asset_tag} receipt accepted.`,
  };
}

async function store(body: StoreScanInput): Promise<WorkflowResult> {
  let previous: Asset | null = null;
  try {
    previous = await api.assets.get(body.asset_tag);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }

  const asset = await api.scans.store(body);
  const sideEffects: string[] = [];

  if (previous?.state === "in_service") {
    await api.mock.updateFacilities({
      tagged_id: asset.asset_tag,
      rack_location: null,
    });
    sideEffects.push("Facilities rack assignment cleared.");
  }

  return {
    asset,
    message: `${asset.asset_tag} stored.`,
    sideEffects,
  };
}

async function deploy(body: DeployScanInput): Promise<WorkflowResult> {
  const asset = await api.scans.deploy(body);
  const rackLocation = locationToRackString(asset.location);
  if (!rackLocation) {
    throw {
      code: "incomplete_deploy_location",
      message: "Deploy requires site, room, rack, and ru.",
      details: { location: asset.location },
    };
  }

  const finance = await api.mock.finance();
  const existingFinance = findFinance(finance, asset.asset_tag);

  await api.mock.updateFacilities({
    tagged_id: asset.asset_tag,
    rack_location: rackLocation,
  });

  await api.mock.updateFinance({
    tag: asset.asset_tag,
    site: asset.location.site,
    status: "capitalized",
    book_value_usd: existingFinance?.book_value_usd,
    capitalized_on: existingFinance?.capitalized_on ?? todayIsoDate(),
  });

  return {
    asset,
    message: `${asset.asset_tag} deployed.`,
    sideEffects: [
      "Facilities rack assignment written.",
      "Finance capitalization written.",
    ],
  };
}

async function transfer(body: TransferScanInput): Promise<WorkflowResult> {
  const asset = await api.scans.transfer(body);
  return {
    asset,
    message: `${asset.asset_tag} transferred to ${asset.custodian}.`,
  };
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
        return NextResponse.json(await receive(body as ReceiveScanInput));
      case "store":
        return NextResponse.json(await store(body as StoreScanInput));
      case "deploy":
        return NextResponse.json(await deploy(body as DeployScanInput));
      case "transfer":
        return NextResponse.json(await transfer(body as TransferScanInput));
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
