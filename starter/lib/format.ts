import type { AssetState, EventType, FinanceRecord } from "./types";

export function titleize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function stateLabel(state: AssetState | string): string {
  if (state === "in_service") return "In service";
  if (state === "rma_pending") return "RMA pending";
  return titleize(state);
}

export function eventLabel(eventType: EventType | string): string {
  if (eventType === "transfer_custody") return "Transfer custody";
  if (eventType === "duplicate_receive") return "Duplicate receive";
  if (eventType === "rma_receive_back") return "RMA receive back";
  if (eventType === "rma_open") return "RMA open";
  return titleize(eventType);
}

export function financeLabel(status: FinanceRecord["status"] | string): string {
  if (status === "pending_receipt") return "Pending receipt";
  return titleize(status);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Not set";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
