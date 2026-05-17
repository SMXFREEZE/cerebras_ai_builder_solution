import { ulid } from "ulid";
import type { AssetState, Event, EventType, Location } from "./types.js";

type BuildEventInput = {
  assetTag: string;
  eventType: EventType;
  fromState: AssetState | null;
  toState: AssetState;
  fromLocation: Location | null;
  toLocation: Location;
  userId: string;
  scanPayload: string;
  timestamp?: string;
};

export function buildEvent(input: BuildEventInput): Event {
  return {
    id: ulid(),
    asset_tag: input.assetTag,
    event_type: input.eventType,
    from_state: input.fromState,
    to_state: input.toState,
    from_location: input.fromLocation,
    to_location: input.toLocation,
    user_id: input.userId,
    scan_payload: input.scanPayload,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };
}
