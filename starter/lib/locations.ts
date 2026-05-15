import type { Location } from "./types";

export const ASSET_TAG_PATTERN = /^C\d{7}$/i;

export function normalizeScan(raw: string): string {
  return raw.trim().replace(/^asset:/i, "").replace(/^tag:/i, "").trim();
}

export function normalizeBadge(raw: string): string {
  return raw.trim().replace(/^badge:/i, "").replace(/^user:/i, "").trim();
}

export function looksLikeAssetTag(raw: string): boolean {
  return ASSET_TAG_PATTERN.test(normalizeScan(raw));
}

export function locationToRackString(location: Location): string | null {
  const { site, room, row, rack, ru } = location;
  if (!site || !room || !rack || !ru) return null;
  return [site, room, row ?? "-", rack, ru].join("/");
}

export function locationLabel(location: Location | null | undefined): string {
  if (!location) return "Unknown";
  const pieces = [
    location.site,
    location.room,
    location.row,
    location.rack,
    location.ru,
  ].filter((part): part is string => Boolean(part));
  return pieces.length ? pieces.join(" / ") : "No location";
}

export function parseLocationScan(raw: string): Location {
  const cleaned = raw
    .trim()
    .replace(/^loc:/i, "")
    .replace(/^location:/i, "")
    .replace(/\s*>\s*/g, "/")
    .replace(/\s*\|\s*/g, "/");

  const parts = cleaned
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    throw new Error("Scan a location as Site/Room[/Row]/Rack[/RU].");
  }

  if (parts.length === 2) {
    return {
      site: parts[0]!,
      room: parts[1]!,
      row: null,
      rack: null,
      ru: null,
    };
  }

  if (parts.length === 3) {
    return {
      site: parts[0]!,
      room: parts[1]!,
      row: null,
      rack: parts[2]!,
      ru: null,
    };
  }

  if (parts.length === 4) {
    return {
      site: parts[0]!,
      room: parts[1]!,
      row: parts[2] === "-" ? null : parts[2]!,
      rack: parts[3]!,
      ru: null,
    };
  }

  return {
    site: parts[0]!,
    room: parts[1]!,
    row: parts[2] === "-" ? null : parts[2]!,
    rack: parts[3]!,
    ru: parts[4]!,
  };
}

export function ensureDeployLocation(location: Location): string | null {
  if (!location.site) return "Site is missing.";
  if (!location.room) return "Room is missing.";
  if (!location.rack) return "Rack is missing.";
  if (!location.ru) return "Rack unit is missing.";
  return null;
}
