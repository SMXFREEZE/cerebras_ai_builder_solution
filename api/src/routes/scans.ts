import type { FastifyInstance } from "fastify";
import type { FastifyReply } from "fastify";
import {
  DeployScanInputSchema,
  ReceiveScanInputSchema,
  StoreScanInputSchema,
  TransferScanInputSchema,
} from "../domain/types.js";
import type { Asset, AssetState, EventType } from "../domain/types.js";
import {
  getAsset,
  getDb,
  insertAsset,
  insertEvent,
  updateAsset,
} from "../db.js";
import { sendError } from "../errors.js";
import { findTransition } from "../domain/state-machine.js";
import { isDeployLocationComplete, isValidTag } from "../domain/validation.js";
import { buildEvent } from "../domain/events.js";

function invalidTag(reply: FastifyReply, assetTag: string) {
  return sendError(
    reply,
    400,
    "invalid_tag_format",
    "asset_tag must match /^C\\d{7}$/",
    { asset_tag: assetTag },
  );
}

function invalidPayload(reply: FastifyReply, label: string, issues: unknown) {
  return sendError(reply, 422, "invalid_location", `Invalid ${label} payload`, {
    issues,
  });
}

function unknownAsset(reply: FastifyReply, assetTag: string) {
  return sendError(reply, 404, "unknown_asset", `Asset ${assetTag} not found`);
}

function invalidTransition(
  reply: FastifyReply,
  fromState: AssetState,
  eventType: EventType,
  verb: string,
) {
  return sendError(
    reply,
    422,
    "invalid_transition",
    `Cannot ${verb} an asset in state '${fromState}'`,
    { from_state: fromState, attempted_event: eventType },
  );
}

export async function scansRoutes(app: FastifyInstance): Promise<void> {
  // POST /v1/scans/receive
  app.post("/v1/scans/receive", async (req, reply) => {
    const parse = ReceiveScanInputSchema.safeParse(req.body);
    if (!parse.success) {
      return invalidPayload(reply, "receive", parse.error.issues);
    }
    const input = parse.data;

    if (!isValidTag(input.asset_tag)) {
      return invalidTag(reply, input.asset_tag);
    }

    const db = getDb();
    const existing = getAsset(db, input.asset_tag);
    const now = new Date().toISOString();

    if (existing) {
      if (existing.serial !== input.serial) {
        return sendError(
          reply,
          409,
          "and_match_failed",
          "asset_tag already exists with a different serial",
          {
            expected_serial: existing.serial,
            provided_serial: input.serial,
          },
        );
      }
      insertEvent(
        db,
        buildEvent({
          assetTag: existing.asset_tag,
          eventType: "duplicate_receive",
          fromState: existing.state,
          toState: existing.state,
          fromLocation: existing.location,
          toLocation: existing.location,
          userId: input.user_id,
          scanPayload: input.scan_payload,
          timestamp: now,
        }),
      );
      return reply.code(200).send(existing);
    }

    const asset: Asset = {
      asset_tag: input.asset_tag,
      serial: input.serial,
      model: input.model,
      manufacturer: input.manufacturer,
      asset_class: input.asset_class,
      state: "received",
      location: input.location,
      custodian: input.user_id,
      parent_asset_tag: null,
      procurement_note: null,
      created_at: now,
      updated_at: now,
    };
    insertAsset(db, asset);

    insertEvent(
      db,
      buildEvent({
        assetTag: asset.asset_tag,
        eventType: "receive",
        fromState: null,
        toState: "received",
        fromLocation: null,
        toLocation: input.location,
        userId: input.user_id,
        scanPayload: input.scan_payload,
        timestamp: now,
      }),
    );
    return reply.code(201).send(asset);
  });

  // POST /v1/scans/store
  app.post("/v1/scans/store", async (req, reply) => {
    const parse = StoreScanInputSchema.safeParse(req.body);
    if (!parse.success) {
      return invalidPayload(reply, "store", parse.error.issues);
    }
    const input = parse.data;
    if (!isValidTag(input.asset_tag)) {
      return invalidTag(reply, input.asset_tag);
    }
    const db = getDb();
    const asset = getAsset(db, input.asset_tag);
    if (!asset) {
      return unknownAsset(reply, input.asset_tag);
    }
    const next = findTransition(asset.state, "store");
    if (next !== "stored") {
      return invalidTransition(reply, asset.state, "store", "store");
    }
    const now = new Date().toISOString();
    updateAsset(db, asset.asset_tag, {
      state: "stored",
      location: input.location,
      custodian: input.user_id,
      updated_at: now,
    });
    insertEvent(
      db,
      buildEvent({
        assetTag: asset.asset_tag,
        eventType: "store",
        fromState: asset.state,
        toState: "stored",
        fromLocation: asset.location,
        toLocation: input.location,
        userId: input.user_id,
        scanPayload: input.scan_payload,
        timestamp: now,
      }),
    );
    return reply.send(getAsset(db, asset.asset_tag));
  });

  // POST /v1/scans/deploy
  app.post("/v1/scans/deploy", async (req, reply) => {
    const parse = DeployScanInputSchema.safeParse(req.body);
    if (!parse.success) {
      return invalidPayload(reply, "deploy", parse.error.issues);
    }
    const input = parse.data;
    if (!isValidTag(input.asset_tag)) {
      return invalidTag(reply, input.asset_tag);
    }
    if (!isDeployLocationComplete(input.location)) {
      return sendError(
        reply,
        422,
        "incomplete_deploy_location",
        "Deploy requires site, room, rack, and ru",
        { location: input.location },
      );
    }
    const db = getDb();
    const asset = getAsset(db, input.asset_tag);
    if (!asset) {
      return unknownAsset(reply, input.asset_tag);
    }
    const next = findTransition(asset.state, "deploy");
    if (next !== "in_service") {
      return invalidTransition(reply, asset.state, "deploy", "deploy");
    }
    const now = new Date().toISOString();
    updateAsset(db, asset.asset_tag, {
      state: "in_service",
      location: input.location,
      custodian: input.user_id,
      updated_at: now,
    });
    insertEvent(
      db,
      buildEvent({
        assetTag: asset.asset_tag,
        eventType: "deploy",
        fromState: asset.state,
        toState: "in_service",
        fromLocation: asset.location,
        toLocation: input.location,
        userId: input.user_id,
        scanPayload: input.scan_payload,
        timestamp: now,
      }),
    );
    return reply.send(getAsset(db, asset.asset_tag));
  });

  // POST /v1/scans/transfer
  // Two-sided custody: the logged-in user (user_id) is the FROM custodian;
  // to_custodian is the badge of the receiving party. State doesn't change.
  app.post("/v1/scans/transfer", async (req, reply) => {
    const parse = TransferScanInputSchema.safeParse(req.body);
    if (!parse.success) {
      return invalidPayload(reply, "transfer", parse.error.issues);
    }
    const input = parse.data;
    if (!isValidTag(input.asset_tag)) {
      return invalidTag(reply, input.asset_tag);
    }
    const db = getDb();
    const asset = getAsset(db, input.asset_tag);
    if (!asset) {
      return unknownAsset(reply, input.asset_tag);
    }
    if (asset.state === "disposed" || asset.state === "unreceived") {
      return invalidTransition(
        reply,
        asset.state,
        "transfer_custody",
        "transfer custody of",
      );
    }
    if (input.to_custodian === asset.custodian) {
      return sendError(
        reply,
        422,
        "same_custodian",
        "to_custodian is already the current custodian",
        { custodian: asset.custodian },
      );
    }
    const now = new Date().toISOString();
    updateAsset(db, asset.asset_tag, {
      state: asset.state,
      location: asset.location,
      custodian: input.to_custodian,
      updated_at: now,
    });
    insertEvent(
      db,
      buildEvent({
        assetTag: asset.asset_tag,
        eventType: "transfer_custody",
        fromState: asset.state,
        toState: asset.state,
        fromLocation: asset.location,
        toLocation: asset.location,
        userId: input.user_id,
        scanPayload: input.scan_payload,
        timestamp: now,
      }),
    );
    return reply.send(getAsset(db, asset.asset_tag));
  });
}
