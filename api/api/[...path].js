const STATE_ID = "default";
const TAG_RE = /^C\d{7}$/i;

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function json(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function error(res, status, code, message, details) {
  json(res, status, { error: details ? { code, message, details } : { code, message } });
}

function loc(room, rack, ru, row = "Aisle-3") {
  return {
    site: "Lab-Building-A",
    room,
    row: rack && ru ? row : null,
    rack,
    ru,
  };
}

function rackString(location) {
  if (!location.site || !location.room || !location.rack || !location.ru) return null;
  return [location.site, location.room, location.row ?? "-", location.rack, location.ru].join("/");
}

function makeAsset(tag, state, location, custodian, index) {
  const classes = ["instrument", "compute", "network", "power", "consumable_durable"];
  const models = ["Genomics Sequencer 2000", "CS-3 module", "Optics shelf", "Power sled", "Rack switch"];
  return {
    asset_tag: tag,
    serial: `SN-${tag.slice(1)}`,
    model: models[index % models.length],
    manufacturer: index % 3 === 0 ? "Cerebras" : index % 3 === 1 ? "BioSystems Inc" : "LabNet",
    asset_class: classes[index % classes.length],
    state,
    location,
    custodian,
    parent_asset_tag: null,
    procurement_note: index % 37 === 0 ? "Expedite for manufacturing bringup." : null,
    created_at: "2026-01-02T09:00:00.000Z",
    updated_at: "2026-01-02T09:00:00.000Z",
  };
}

function baseEvents(asset) {
  const receiving = loc("Receiving", "DOCK-1", null);
  const events = [{
    id: id(),
    asset_tag: asset.asset_tag,
    event_type: "receive",
    from_state: null,
    to_state: "received",
    from_location: null,
    to_location: receiving,
    user_id: asset.custodian.startsWith("tech-") ? asset.custodian : "tech-carlos",
    scan_payload: `RECEIVE|${asset.asset_tag}|${asset.serial}`,
    timestamp: "2025-08-01T12:00:00.000Z",
  }];

  if (asset.state !== "received" && asset.state !== "unreceived") {
    events.push({
      id: id(),
      asset_tag: asset.asset_tag,
      event_type: "store",
      from_state: "received",
      to_state: "stored",
      from_location: receiving,
      to_location: asset.location,
      user_id: asset.custodian,
      scan_payload: `STORE|${asset.asset_tag}`,
      timestamp: "2025-08-08T12:00:00.000Z",
    });
  }

  if (["in_service", "rma_pending", "disposed"].includes(asset.state)) {
    events.push({
      id: id(),
      asset_tag: asset.asset_tag,
      event_type: "deploy",
      from_state: "stored",
      to_state: "in_service",
      from_location: asset.location,
      to_location: asset.location,
      user_id: asset.custodian,
      scan_payload: `DEPLOY|${asset.asset_tag}`,
      timestamp: "2025-08-15T12:00:00.000Z",
    });
  }

  return events;
}

function seed() {
  const assets = [];
  for (let i = 0; i < 1012; i += 1) {
    const tag = `C${String(101 + i).padStart(7, "0")}`;
    let state = "in_service";
    if (i % 20 === 6) state = "received";
    if (i % 9 === 3) state = "stored";
    if (i % 23 === 8) state = "rma_pending";
    if (i % 251 === 8) state = "disposed";

    const location =
      state === "received"
        ? loc("Receiving", "DOCK-2", null)
        : state === "stored"
          ? loc("Storage-1", `SHELF-${(i % 8) + 1}`, null)
          : state === "rma_pending"
            ? loc("Staging-RMA", "BIN-RMA-1", null)
            : state === "disposed"
              ? loc("Disposal", "PALLET-9", null)
              : loc(`Bay-${String((i % 14) + 1).padStart(2, "0")}`, `B-${String((i % 9) + 1).padStart(2, "0")}`, `U${String((i % 42) + 1).padStart(2, "0")}`);

    assets.push(makeAsset(tag, state, location, i % 2 === 0 ? "tech-jane" : "tech-mike", i));
  }

  const events = assets.flatMap(baseEvents);
  const facilities = assets
    .filter((asset) => asset.state === "in_service")
    .map((asset) => ({
      space_id: `fac-${asset.asset_tag}`,
      tagged_id: asset.asset_tag,
      rack_location: rackString(asset.location) ?? "Lab-Building-A/Bay-00/-/UNKNOWN/U0",
      last_observed: "2026-05-08T03:00:00Z",
    }));

  const finance = assets.map((asset, index) => ({
    finance_id: `EQ-${asset.asset_tag.slice(1)}`,
    tag: asset.asset_tag,
    site: index % 127 === 0 ? "Lab-Building-B" : asset.location.site,
    book_value_usd: 45000 + index * 730,
    status: asset.state === "disposed" ? "retired" : asset.state === "in_service" ? "capitalized" : "pending_receipt",
    capitalized_on: asset.state === "in_service" ? "2025-09-20" : null,
  }));

  facilities.push({
    space_id: "fac-orphan",
    tagged_id: "C0099999",
    rack_location: "Lab-Building-A/Bay-77/-/ORPHAN/U1",
    last_observed: "2026-05-08T03:00:00Z",
  });
  finance.push({
    finance_id: "EQ-ghost",
    tag: "C0088888",
    site: "Lab-Building-A",
    book_value_usd: 98000,
    status: "pending_receipt",
    capitalized_on: null,
  });

  return { assets, events, facilities, finance };
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  return { url, key };
}

async function loadStore() {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/assetops_state?id=eq.${STATE_ID}&select=data`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`State read failed: ${response.status}`);
  const rows = await response.json();
  if (rows[0]?.data) return rows[0].data;
  const fresh = seed();
  await saveStore(fresh);
  return fresh;
}

async function saveStore(data) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/assetops_state`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ id: STATE_ID, data, updated_at: now() }),
  });
  if (!response.ok) throw new Error(`State write failed: ${response.status} ${await response.text()}`);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function findAsset(data, tag) {
  return data.assets.find((asset) => asset.asset_tag.toUpperCase() === tag.toUpperCase());
}

function validateTag(res, tag) {
  if (TAG_RE.test(tag)) return false;
  error(res, 400, "invalid_tag_format", "asset_tag must match /^C\\d{7}$/", { asset_tag: tag });
  return true;
}

function addEvent(asset, eventType, fromState, fromLocation, userId, scanPayload) {
  return {
    id: id(),
    asset_tag: asset.asset_tag,
    event_type: eventType,
    from_state: fromState,
    to_state: asset.state,
    from_location: fromLocation,
    to_location: asset.location,
    user_id: userId,
    scan_payload: scanPayload,
    timestamp: now(),
  };
}

function routeParts(req) {
  const url = new URL(req.url, "https://assetops.local");
  const path = url.pathname.replace(/^\/api/, "").replace(/^\/+/, "");
  const parts = path ? path.split("/") : [];
  return parts[0] === "v1" ? parts.slice(1) : parts;
}

export default async function handler(req, res) {
  try {
    const parts = routeParts(req);
    const [root, second, third] = parts;

    if (req.method === "GET" && root === "health") {
      return json(res, 200, { ok: true, version: "1.0.0-supabase" });
    }

    if (req.method === "POST" && root === "reset") {
      const fresh = seed();
      await saveStore(fresh);
      return json(res, 200, { ok: true, reseeded_at: now() });
    }

    const data = await loadStore();
    const url = new URL(req.url, "https://assetops.local");

    if (req.method === "GET" && root === "assets" && !second) {
      const state = url.searchParams.get("state");
      const site = url.searchParams.get("site");
      const custodian = url.searchParams.get("custodian");
      return json(res, 200, data.assets.filter((asset) => {
        if (state && asset.state !== state) return false;
        if (site && asset.location.site !== site) return false;
        if (custodian && asset.custodian !== custodian) return false;
        return true;
      }));
    }

    if (root === "assets" && second) {
      if (validateTag(res, second)) return;
      const asset = findAsset(data, second);
      if (!asset) return error(res, 404, "unknown_asset", `Asset ${second} not found`, { asset_tag: second });
      if (req.method === "GET" && third === "events") {
        return json(res, 200, data.events.filter((event) => event.asset_tag === asset.asset_tag).sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      }
      if (req.method === "GET" && !third) return json(res, 200, asset);
    }

    if (root === "mock" && second === "facilities" && third === "spaces") {
      if (req.method === "GET") return json(res, 200, data.facilities);
      const update = await readBody(req);
      data.facilities = data.facilities.filter((row) => row.tagged_id !== update.tagged_id);
      if (update.rack_location) {
        data.facilities.push({
          space_id: `fac-${update.tagged_id}`,
          tagged_id: update.tagged_id,
          rack_location: update.rack_location,
          last_observed: now(),
        });
      }
      await saveStore(data);
      return json(res, 200, { ok: true });
    }

    if (root === "mock" && second === "finance" && third === "equipment") {
      if (req.method === "GET") return json(res, 200, data.finance);
      const update = await readBody(req);
      data.finance = data.finance.filter((row) => row.tag !== update.tag);
      data.finance.push({
        finance_id: `EQ-${update.tag}`,
        tag: update.tag,
        site: update.site ?? "Lab-Building-A",
        book_value_usd: update.book_value_usd ?? 75000,
        status: update.status,
        capitalized_on: update.capitalized_on ?? null,
      });
      await saveStore(data);
      return json(res, 200, { ok: true });
    }

    if (root === "scans" && second && req.method === "POST") {
      const input = await readBody(req);
      const tag = String(input.asset_tag ?? "");
      if (validateTag(res, tag)) return;

      if (second === "receive") {
        const existing = findAsset(data, tag);
        if (existing) {
          if (existing.serial !== input.serial) {
            return error(res, 409, "and_match_failed", "asset_tag already exists with a different serial", {
              expected_serial: existing.serial,
              provided_serial: input.serial,
            });
          }
          data.events.push(addEvent(existing, "duplicate_receive", existing.state, existing.location, input.user_id, input.scan_payload));
          await saveStore(data);
          return json(res, 200, existing);
        }

        const asset = {
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
        data.assets.push(asset);
        data.events.push(addEvent(asset, "receive", null, null, input.user_id, input.scan_payload));
        await saveStore(data);
        return json(res, 201, asset);
      }

      const asset = findAsset(data, tag);
      if (!asset) return error(res, 404, "unknown_asset", `Asset ${tag} not found`, { asset_tag: tag });
      if (asset.state === "disposed" || asset.state === "unreceived") {
        return error(res, 422, "invalid_transition", `Cannot scan an asset in state '${asset.state}'`, { from_state: asset.state });
      }

      if (second === "store") {
        const fromState = asset.state;
        const fromLocation = asset.location;
        asset.state = "stored";
        asset.location = input.location;
        asset.custodian = input.user_id;
        asset.updated_at = now();
        data.events.push(addEvent(asset, "store", fromState, fromLocation, input.user_id, input.scan_payload));
        await saveStore(data);
        return json(res, 200, asset);
      }

      if (second === "deploy") {
        if (!input.location?.site || !input.location?.room || !input.location?.rack || !input.location?.ru) {
          return error(res, 422, "incomplete_deploy_location", "Deploy requires site, room, rack, and ru", { location: input.location });
        }
        const fromState = asset.state;
        const fromLocation = asset.location;
        asset.state = "in_service";
        asset.location = input.location;
        asset.custodian = input.user_id;
        asset.updated_at = now();
        data.events.push(addEvent(asset, "deploy", fromState, fromLocation, input.user_id, input.scan_payload));
        await saveStore(data);
        return json(res, 200, asset);
      }

      if (second === "transfer") {
        if (asset.custodian === input.to_custodian) {
          return error(res, 422, "same_custodian", "to_custodian is already the current custodian", { custodian: asset.custodian });
        }
        const fromState = asset.state;
        const fromLocation = asset.location;
        asset.custodian = input.to_custodian;
        asset.updated_at = now();
        data.events.push(addEvent(asset, "transfer_custody", fromState, fromLocation, input.user_id, input.scan_payload));
        await saveStore(data);
        return json(res, 200, asset);
      }
    }

    return error(res, 404, "not_found", "Route not found");
  } catch (err) {
    return error(res, 500, "internal_error", err instanceof Error ? err.message : "Unexpected server error");
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
