import { describe, expect, it, vi } from "vitest";
import { ApiError, type ApiClient } from "@/lib/api-client";
import { runWorkflow } from "@/lib/workflows";
import type {
  Asset,
  DeployScanInput,
  FinanceRecord,
  StoreScanInput,
} from "@/lib/types";

const dock = {
  site: "Lab-Building-A",
  room: "Receiving",
  row: null,
  rack: "DOCK-1",
  ru: null,
};

const storage = {
  site: "Lab-Building-A",
  room: "Storage-1",
  row: null,
  rack: "SHELF-3",
  ru: null,
};

const rack = {
  site: "Lab-Building-A",
  room: "Bay-12",
  row: "Aisle-3",
  rack: "B-04",
  ru: "U21",
};

function asset(overrides: Partial<Asset> = {}): Asset {
  return {
    asset_tag: "C0009001",
    serial: "SN-1",
    model: "CS-3 module",
    manufacturer: "Cerebras",
    asset_class: "compute",
    state: "received",
    location: dock,
    custodian: "tech-jane",
    parent_asset_tag: null,
    procurement_note: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function finance(overrides: Partial<FinanceRecord> = {}): FinanceRecord {
  return {
    finance_id: "EQ-1",
    tag: "C0009001",
    site: "Lab-Building-A",
    book_value_usd: 1250000,
    status: "pending_receipt",
    capitalized_on: "2026-01-15",
    ...overrides,
  };
}

function client() {
  const c = {
    health: vi.fn(),
    reset: vi.fn(),
    assets: {
      list: vi.fn(),
      get: vi.fn(),
      history: vi.fn(),
    },
    scans: {
      receive: vi.fn(),
      store: vi.fn(),
      deploy: vi.fn(),
      transfer: vi.fn(),
    },
    mock: {
      facilities: vi.fn(),
      finance: vi.fn(),
      updateFacilities: vi.fn(),
      updateFinance: vi.fn(),
    },
  };
  return c as typeof c & ApiClient;
}

describe("workflow backend", () => {
  it("deploy writes facilities and finance from the committed asset", async () => {
    const c = client();
    const deployed = asset({ state: "in_service", location: rack });
    c.scans.deploy.mockResolvedValue(deployed);
    c.mock.finance.mockResolvedValue([finance()]);
    c.mock.updateFacilities.mockResolvedValue({ ok: true });
    c.mock.updateFinance.mockResolvedValue({ ok: true });

    const input: DeployScanInput = {
      asset_tag: deployed.asset_tag,
      location: rack,
      user_id: "tech-jane",
      scan_payload: `DEPLOY|${deployed.asset_tag}`,
    };
    const result = await runWorkflow("deploy", input, c);

    expect(result.message).toBe("C0009001 deployed.");
    expect(result.sideEffects).toEqual([
      "Facilities rack assignment written.",
      "Finance capitalization written.",
    ]);
    expect(c.mock.updateFacilities).toHaveBeenCalledWith({
      tagged_id: "C0009001",
      rack_location: "Lab-Building-A/Bay-12/Aisle-3/B-04/U21",
    });
    expect(c.mock.updateFinance).toHaveBeenCalledWith({
      tag: "C0009001",
      site: "Lab-Building-A",
      status: "capitalized",
      book_value_usd: 1250000,
      capitalized_on: "2026-01-15",
    });
  });

  it("store from in_service de-racks facilities", async () => {
    const c = client();
    c.assets.get.mockResolvedValue(asset({ state: "in_service", location: rack }));
    c.scans.store.mockResolvedValue(asset({ state: "stored", location: storage }));
    c.mock.updateFacilities.mockResolvedValue({ ok: true });

    const input: StoreScanInput = {
      asset_tag: "C0009001",
      location: storage,
      user_id: "tech-jane",
      scan_payload: "STORE|C0009001",
    };
    const result = await runWorkflow("store", input, c);

    expect(result.sideEffects).toEqual(["Facilities rack assignment cleared."]);
    expect(c.mock.updateFacilities).toHaveBeenCalledWith({
      tagged_id: "C0009001",
      rack_location: null,
    });
  });

  it("store from received leaves facilities untouched", async () => {
    const c = client();
    c.assets.get.mockResolvedValue(asset({ state: "received", location: dock }));
    c.scans.store.mockResolvedValue(asset({ state: "stored", location: storage }));

    await runWorkflow(
      "store",
      {
        asset_tag: "C0009001",
        location: storage,
        user_id: "tech-jane",
        scan_payload: "STORE|C0009001",
      },
      c,
    );

    expect(c.mock.updateFacilities).not.toHaveBeenCalled();
  });

  it("ignores a stale prefetch 404 and lets the scan endpoint decide", async () => {
    const c = client();
    c.assets.get.mockRejectedValue(
      new ApiError(404, "unknown_asset", "Asset missing"),
    );
    c.scans.store.mockResolvedValue(asset({ state: "stored", location: storage }));

    const result = await runWorkflow(
      "store",
      {
        asset_tag: "C0009001",
        location: storage,
        user_id: "tech-jane",
        scan_payload: "STORE|C0009001",
      },
      c,
    );

    expect(result.message).toBe("C0009001 stored.");
    expect(c.scans.store).toHaveBeenCalledOnce();
  });

  it("does not write side effects when deploy returns an incomplete location", async () => {
    const c = client();
    c.scans.deploy.mockResolvedValue(
      asset({
        state: "in_service",
        location: { ...rack, ru: null },
      }),
    );

    await expect(
      runWorkflow(
        "deploy",
        {
          asset_tag: "C0009001",
          location: { ...rack, ru: null },
          user_id: "tech-jane",
          scan_payload: "DEPLOY|C0009001",
        },
        c,
      ),
    ).rejects.toMatchObject({
      code: "incomplete_deploy_location",
    });
    expect(c.mock.updateFacilities).not.toHaveBeenCalled();
    expect(c.mock.updateFinance).not.toHaveBeenCalled();
  });
});
