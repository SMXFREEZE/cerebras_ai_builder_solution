import { NextRequest, NextResponse } from "next/server";
import type {
  Asset,
  AssetClass,
  AssetState,
  Event,
  EventType,
  FacilitiesRecord,
  FinanceRecord,
  Location,
} from "./types";

type Store = {
  assets: Asset[];
  events: Event[];
  facilities: FacilitiesRecord[];
  finance: FinanceRecord[];
};

const STORE_KEY = Symbol.for("assetops.deployedApiStore");
const TAG_RE = /^C\d{7}$/i;

function now(): string {
  return new Date().toISOString();
}

function id(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function rack(location: Location): string | null {
  if (!location.site || !location.room || !location.rack || !location.ru) return null;
  return [location.site, location.room, location.row ?? "-", location.rack, location.ru].join("/");
}

function loc(
  room: string,
  rackId: string | null,
  ru: string | null,
  row = "Aisle-3",
): Location {
  return {
    site: "Lab-Building-A",
    room,
    row: rackId ? row : null,
    rack: rackId,
    ru,
  };
}

function asset(
  tag: string,
  state: AssetState,
  location: Location,
  custodian: string,
  index: number,
): Asset {
  const timestamp = "2026-01-02T09:00:00.000Z";
  const classes: AssetClass[] = ["compute", "instrument", "network", "power"];
  return {
    asset_tag: tag,
    serial: `SN-${tag.slice(1)}`,
    model: index % 3 === 0 ? "CS-3 module" : index % 3 === 1 ? "Optics shelf" : "Power sled",
    manufacturer: "Cerebras",
    asset_class: classes[index % classes.length]!,
    state,
    location,
    custodian,
    parent_asset_tag: null,
    procurement_note: index % 7 === 0 ? "Expedite for manufacturing bringup." : null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function seed(): Store {
  const assets: Asset[] = [
    asset("C0000101", "in_service", loc("Bay-12", "B-04", "U21"), "tech-ana", 1),
    asset("C0000104", "stored", loc("Storage-1", "SHELF-3", null), "inventory", 2),
    asset("C0000108", "rma_pending", loc("Finance mismatch", null, null), "manager", 3),
    asset("C0000110", "received", loc("Receiving", "DOCK-1", null), "tech-mike", 4),
    asset("C0000114", "in_service", loc("Bay-08", "A-02", "U14"), "tech-ray", 5),
    asset("C0000119", "stored", loc("Storage-2", "SHELF-1", null), "inventory", 6),
    asset("C0000122", "in_service", loc("Bay-04", "C-01", "U07", "Aisle-1"), "tech-mike", 7),
    asset("C0000128", "received", loc("Receiving", "DOCK-2", null), "tech-ana", 8),
    asset("C0000131", "in_service", loc("Bay-04", "C-01", "U11", "Aisle-1"), "tech-ray", 9),
    asset("C0000133", "in_service", loc("Bay-04", "C-02", "U13", "Aisle-1"), "tech-ana", 10),
  ];

  for (let i = 0; i < 90; i += 1) {
    const tag = `C${String(200 + i).padStart(7, "0")}`;
    const state: AssetState = i % 11 === 0 ? "disposed" : i % 5 === 0 ? "stored" : "in_service";
    const location =
      state === "in_service"
        ? loc(`Bay-${String((i % 14) + 1).padStart(2, "0")}`, `R-${(i % 8) + 1}`, `U${(i % 36) + 1}`)
        : loc("Storage-1", `SHELF-${(i % 6) + 1}`, null);
    assets.push(asset(tag, state, location, i % 2 === 0 ? "tech-ana" : "tech-mike", i + 11));
  }

  const events = assets.flatMap((entry) => baseEvents(entry));
  const facilities = assets
    .filter((entry) => entry.state === "in_service")
    .map((entry) => ({
      space_id: `space-${entry.asset_tag}`,
      tagged_id: entry.asset_tag,
      rack_location: rack(entry.location) ?? "Lab-Building-A/Bay-00/-/UNKNOWN/U0",
      last_observed: "2026-01-02T09:00:00.000Z",
    }));
  facilities.push({
    space_id: "space-orphan",
    tagged_id: "C0099999",
    rack_location: "Lab-Building-A/Bay-77/-/ORPHAN/U1",
    last_observed: "2026-01-02T09:00:00.000Z",
  });

  const finance = assets.map((entry, index) => ({
    finance_id: `fin-${entry.asset_tag}`,
    tag: entry.asset_tag,
    site: index % 13 === 0 ? "Lab-Building-B" : entry.location.site,
    book_value_usd: 45000 + index * 730,
    status:
      entry.state === "disposed"
        ? "retired"
        : entry.state === "in_service"
          ? "capitalized"
          : "pending_receipt",
    capitalized_on: entry.state === "in_service" ? "2026-01-02" : null,
  })) satisfies FinanceRecord[];
  finance.push({
    finance_id: "fin-ghost",
    tag: "C0088888",
    site: "Lab-Building-A",
    book_value_usd: 98000,
    status: "pending_receipt",
    capitalized_on: null,
  });

  return { assets, events, facilities, finance };
}

function baseEvents(entry: Asset): Event[] {
  const received: Location = loc("Receiving", "DOCK-1", null);
  const events: Event[] = [
    {
      id: id(),
      asset_tag: entry.asset_tag,
      event_type: "receive",
      from_state: null,
      to_state: "received",
      from_location: null,
      to_location: received,
      user_id: entry.custodian,
      scan_payload: `RECEIVE|${entry.asset_tag}`,
      timestamp: "2026-01-02T09:00:00.000Z",
    },
  ];
  if (entry.state !== "received" && entry.state !== "unreceived") {
    events.push({
      id: id(),
      asset_tag: entry.asset_tag,
      event_type: "store",
      from_state: "received",
      to_state: entry.state === "stored" ? "stored" : "stored",
      from_location: received,
      to_location: entry.location,
      user_id: entry.custodian,
      scan_payload: `STORE|${entry.asset_tag}`,
      timestamp: "2026-01-03T09:00:00.000Z",
    });
  }
  if (entry.state === "in_service" || entry.state === "rma_pending" || entry.state === "disposed") {
    events.push({
      id: id(),
      asset_tag: entry.asset_tag,
      event_type: "deploy",
      from_state: "stored",
      to_state: "in_service",
      from_location: entry.location,
      to_location: entry.location,
      user_id: entry.custodian,
      scan_payload: `DEPLOY|${entry.asset_tag}`,
      timestamp: "2026-01-04T09:00:00.000Z",
    });
  }
  return events;
}

function store(): Store {
  const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: Store };
  globalStore[STORE_KEY] ??= seed();
  return globalStore[STORE_KEY]!;
}

function reset(): Store {
  const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: Store };
  globalStore[STORE_KEY] = seed();
  return globalStore[STORE_KEY]!;
}

function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

function error(status: number, code: string, message: string, details?: Record<string, unknown>): NextResponse {
  return json({ error: { code, message, details } }, status);
}

async function body(req: NextRequest): Promise<Record<string, any>> {
  const text = await req.text();
  return text ? JSON.parse(text) : {};
}

function event(
  entry: Asset,
  type: EventType,
  fromState: AssetState | null,
  fromLocation: Location | null,
  toLocation: Location,
  userId: string,
  scanPayload: string,
): Event {
  return {
    id: id(),
    asset_tag: entry.asset_tag,
    event_type: type,
    from_state: fromState,
    to_state: entry.state,
    from_location: fromLocation,
    to_location: toLocation,
    user_id: userId,
    scan_payload: scanPayload,
    timestamp: now(),
  };
}

function findAsset(data: Store, tag: string): Asset | undefined {
  return data.assets.find((entry) => entry.asset_tag.toUpperCase() === tag.toUpperCase());
}

function validateTag(tag: string): NextResponse | null {
  return TAG_RE.test(tag) ? null : error(400, "invalid_tag_format", "Asset tag must look like C0000000.", { asset_tag: tag });
}

export async function handleDeployedApi(req: NextRequest, segments: string[]): Promise<NextResponse> {
  const data = segments[0] === "reset" ? reset() : store();
  const [root, second, third] = segments;

  if (req.method === "GET" && root === "health") {
    return json({ ok: true, version: "deployed-fallback" });
  }

  if (req.method === "POST" && root === "reset") {
    return json({ ok: true });
  }

  if (req.method === "GET" && root === "assets" && !second) {
    const state = req.nextUrl.searchParams.get("state");
    const site = req.nextUrl.searchParams.get("site");
    const custodian = req.nextUrl.searchParams.get("custodian");
    return json(
      data.assets.filter((entry) => {
        if (state && entry.state !== state) return false;
        if (site && entry.location.site !== site) return false;
        if (custodian && entry.custodian !== custodian) return false;
        return true;
      }),
    );
  }

  if (root === "assets" && second) {
    const tagError = validateTag(second);
    if (tagError) return tagError;
    const entry = findAsset(data, second);
    if (!entry) return error(404, "unknown_asset", "Asset not found.", { asset_tag: second });
    if (req.method === "GET" && third === "events") {
      return json(data.events.filter((item) => item.asset_tag === entry.asset_tag).reverse());
    }
    if (req.method === "GET" && !third) return json(entry);
  }

  if (root === "mock" && second === "facilities" && third === "spaces") {
    if (req.method === "GET") return json(data.facilities);
    const update = await body(req);
    data.facilities = data.facilities.filter((row) => row.tagged_id !== update.tagged_id);
    if (update.rack_location) {
      data.facilities.push({
        space_id: `space-${update.tagged_id}`,
        tagged_id: update.tagged_id,
        rack_location: update.rack_location,
        last_observed: now(),
      });
    }
    return json({ ok: true });
  }

  if (root === "mock" && second === "finance" && third === "equipment") {
    if (req.method === "GET") return json(data.finance);
    const update = await body(req);
    data.finance = data.finance.filter((row) => row.tag !== update.tag);
    data.finance.push({
      finance_id: `fin-${update.tag}`,
      tag: update.tag,
      site: update.site ?? "Lab-Building-A",
      book_value_usd: update.book_value_usd ?? 75000,
      status: update.status,
      capitalized_on: update.capitalized_on ?? null,
    });
    return json({ ok: true });
  }

  if (root === "scans" && second && req.method === "POST") {
    const input = await body(req);
    const tag = String(input.asset_tag ?? "");
    const tagError = validateTag(tag);
    if (tagError) return tagError;

    if (second === "receive") {
      const existing = findAsset(data, tag);
      if (existing) {
        if (existing.serial !== input.serial) {
          return error(409, "and_match_failed", "asset_tag already exists with a different serial", {
            expected_serial: existing.serial,
            scanned_serial: input.serial,
          });
        }
        data.events.push(event(existing, "duplicate_receive", existing.state, existing.location, existing.location, input.user_id, input.scan_payload));
        return json(existing);
      }
      const entry: Asset = {
        asset_tag: tag,
        serial: input.serial,
        model: input.model,
        manufacturer: input.manufacturer,
        asset_class: input.asset_class,
        state: "received",
        location: input.location,
        custodian: input.user_id,
        parent_asset_tag: null,
        procurement_note: null,
        created_at: now(),
        updated_at: now(),
      };
      data.assets.unshift(entry);
      data.events.push(event(entry, "receive", null, null, entry.location, input.user_id, input.scan_payload));
      return json(entry, 201);
    }

    const entry = findAsset(data, tag);
    if (!entry) return error(404, "unknown_asset", "Asset not found.", { asset_tag: tag });
    if (entry.state === "disposed") return error(422, "invalid_transition", "Disposed assets cannot be scanned into this workflow.");

    if (second === "store") {
      const fromState = entry.state;
      const fromLocation = entry.location;
      entry.state = "stored";
      entry.location = input.location;
      entry.updated_at = now();
      data.events.push(event(entry, "store", fromState, fromLocation, entry.location, input.user_id, input.scan_payload));
      return json(entry);
    }

    if (second === "deploy") {
      if (!input.location?.site || !input.location?.room || !input.location?.rack || !input.location?.ru) {
        return error(422, "incomplete_deploy_location", "Deploy requires site, room, rack, and ru.", { location: input.location });
      }
      const fromState = entry.state;
      const fromLocation = entry.location;
      entry.state = "in_service";
      entry.location = input.location;
      entry.updated_at = now();
      data.events.push(event(entry, "deploy", fromState, fromLocation, entry.location, input.user_id, input.scan_payload));
      return json(entry);
    }

    if (second === "transfer") {
      if (entry.custodian === input.to_custodian) {
        return error(422, "same_custodian", "Receiving party already has custody.", { custodian: entry.custodian });
      }
      const fromState = entry.state;
      const fromLocation = entry.location;
      entry.custodian = input.to_custodian;
      entry.updated_at = now();
      data.events.push(event(entry, "transfer_custody", fromState, fromLocation, entry.location, input.user_id, input.scan_payload));
      return json(entry);
    }
  }

  return error(404, "not_found", "Route not found");
}
