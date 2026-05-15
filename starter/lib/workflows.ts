import { api, type ApiClient } from "./api-client";
import { locationToRackString } from "./locations";
import type {
  Asset,
  DeployScanInput,
  FinanceRecord,
  ReceiveScanInput,
  StoreScanInput,
  TransferScanInput,
} from "./types";

export type WorkflowAction = "receive" | "store" | "deploy" | "transfer";

export type WorkflowResult = {
  asset: Asset;
  message: string;
  sideEffects?: string[];
};

type StructuredWorkflowError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function findFinance(finance: FinanceRecord[], tag: string): FinanceRecord | null {
  return finance.find((record) => record.tag === tag) ?? null;
}

async function receive(
  client: ApiClient,
  body: ReceiveScanInput,
): Promise<WorkflowResult> {
  const asset = await client.scans.receive(body);
  return {
    asset,
    message: `${asset.asset_tag} receipt accepted.`,
  };
}

async function store(
  client: ApiClient,
  body: StoreScanInput,
): Promise<WorkflowResult> {
  let previous: Asset | null = null;
  try {
    previous = await client.assets.get(body.asset_tag);
  } catch (error) {
    if (
      !(
        error instanceof Error &&
        "status" in error &&
        (error as { status?: number }).status === 404
      )
    ) {
      throw error;
    }
  }

  const asset = await client.scans.store(body);
  const sideEffects: string[] = [];

  if (previous?.state === "in_service") {
    await client.mock.updateFacilities({
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

async function deploy(
  client: ApiClient,
  body: DeployScanInput,
): Promise<WorkflowResult> {
  const asset = await client.scans.deploy(body);
  const rackLocation = locationToRackString(asset.location);
  if (!rackLocation) {
    throw {
      code: "incomplete_deploy_location",
      message: "Deploy requires site, room, rack, and ru.",
      details: { location: asset.location },
    } satisfies StructuredWorkflowError;
  }

  const finance = await client.mock.finance();
  const existingFinance = findFinance(finance, asset.asset_tag);

  await client.mock.updateFacilities({
    tagged_id: asset.asset_tag,
    rack_location: rackLocation,
  });

  await client.mock.updateFinance({
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

async function transfer(
  client: ApiClient,
  body: TransferScanInput,
): Promise<WorkflowResult> {
  const asset = await client.scans.transfer(body);
  return {
    asset,
    message: `${asset.asset_tag} transferred to ${asset.custodian}.`,
  };
}

export async function runWorkflow(
  action: WorkflowAction,
  body: unknown,
  client: ApiClient = api,
): Promise<WorkflowResult> {
  switch (action) {
    case "receive":
      return receive(client, body as ReceiveScanInput);
    case "store":
      return store(client, body as StoreScanInput);
    case "deploy":
      return deploy(client, body as DeployScanInput);
    case "transfer":
      return transfer(client, body as TransferScanInput);
  }
}
