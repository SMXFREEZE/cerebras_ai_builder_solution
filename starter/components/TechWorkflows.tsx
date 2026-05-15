"use client";

import { useCallback, useMemo, useState } from "react";
import { CameraScanButton } from "@/components/CameraScanButton";
import { ScanInput } from "@/components/ScanInput";
import { StateBadge } from "@/components/StatusBadge";
import { getCurrentUserId } from "@/lib/auth";
import { stateLabel } from "@/lib/format";
import {
  ensureDeployLocation,
  locationLabel,
  looksLikeAssetTag,
  normalizeBadge,
  normalizeScan,
  parseLocationScan,
} from "@/lib/locations";
import type { Asset, AssetClass, Location } from "@/lib/types";

type WorkflowAction = "receive" | "store" | "deploy" | "transfer";

type WorkflowSuccess = {
  asset: Asset;
  message: string;
  sideEffects?: string[];
};

type WorkflowFailure = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

type FormStatus =
  | { kind: "idle" }
  | { kind: "loading"; label: string }
  | { kind: "success"; result: WorkflowSuccess }
  | { kind: "error"; error: WorkflowFailure["error"] };

const RECEIVE_LOCATION = "Lab-Building-A/Receiving/DOCK-1";
const STORE_LOCATION = "Lab-Building-A/Storage-1/SHELF-3";
const DEPLOY_LOCATION = "Lab-Building-A/Bay-12/Aisle-3/B-04/U21";
const BADGE_PRESETS = ["tech-mike", "tech-ana", "manager-paul"];

async function postWorkflow(
  action: WorkflowAction,
  body: unknown,
): Promise<WorkflowSuccess> {
  const res = await fetch(`/api/workflows/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as WorkflowSuccess | WorkflowFailure;
  if (!res.ok) {
    const failure = data as WorkflowFailure;
    throw (
      failure.error ?? {
        code: "request_failed",
        message: `Workflow failed with HTTP ${res.status}`,
      }
    );
  }
  return data as WorkflowSuccess;
}

function WorkflowShell({
  title,
  eyebrow,
  children,
  status,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  status: FormStatus;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">{title}</h1>
        </div>
        <a
          href="/tech"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Tech home
        </a>
      </div>
      {children}
      <StatusPanel status={status} />
    </div>
  );
}

function StatusPanel({ status }: { status: FormStatus }) {
  if (status.kind === "idle") return null;
  if (status.kind === "loading") {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900">
        {status.label}
      </div>
    );
  }
  if (status.kind === "error") {
    return <ErrorPanel error={status.error} />;
  }
  return <SuccessPanel result={status.result} />;
}

function ErrorPanel({ error }: { error: WorkflowFailure["error"] }) {
  const expected = error.details?.expected_serial;
  const provided = error.details?.provided_serial;
  const fromState = error.details?.from_state;

  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
      <div className="font-semibold">{error.message}</div>
      <div className="mt-1 text-rose-800">Code: {error.code}</div>
      {expected || provided ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <DetailPill label="Expected serial" value={String(expected ?? "-")} />
          <DetailPill label="Scanned serial" value={String(provided ?? "-")} />
        </div>
      ) : null}
      {fromState ? (
        <div className="mt-3">
          <DetailPill
            label="Current state"
            value={stateLabel(String(fromState))}
          />
        </div>
      ) : null}
    </div>
  );
}

function SuccessPanel({ result }: { result: WorkflowSuccess }) {
  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{result.message}</span>
        <StateBadge state={result.asset.state} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <DetailPill label="Asset" value={result.asset.asset_tag} />
        <DetailPill label="Custodian" value={result.asset.custodian} />
        <DetailPill label="Location" value={locationLabel(result.asset.location)} />
      </div>
      {result.sideEffects?.length ? (
        <div className="mt-3 rounded-md bg-white/70 p-3 text-emerald-900">
          {result.sideEffects.join(" ")}
        </div>
      ) : null}
    </div>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-3 py-2 ring-1 ring-inset ring-black/10">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 break-words font-semibold text-gray-950">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <input
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-950 shadow-sm focus:border-blue-600 focus:outline-none"
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-950 shadow-sm focus:border-blue-600 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-[44px] rounded-md bg-gray-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-[44px] rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function setLocalError(
  setStatus: (status: FormStatus) => void,
  message: string,
  code = "local_validation",
): void {
  setStatus({ kind: "error", error: { code, message } });
}

function tagOrError(raw: string): string {
  const tag = normalizeScan(raw).toUpperCase();
  if (!looksLikeAssetTag(tag)) {
    throw new Error("Asset tags must look like C0009001.");
  }
  return tag;
}

export function ReceiveWorkflow() {
  const [serial, setSerial] = useState("SN-DEMO-1");
  const [model, setModel] = useState("CS-3 module");
  const [manufacturer, setManufacturer] = useState("Cerebras");
  const [assetClass, setAssetClass] = useState<AssetClass>("compute");
  const [locationRaw, setLocationRaw] = useState(RECEIVE_LOCATION);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });

  const disabled = status.kind === "loading";

  const submitTag = useCallback(
    async (rawTag: string): Promise<void> => {
      try {
        const assetTag = tagOrError(rawTag);
        const location = parseLocationScan(locationRaw);
        setStatus({ kind: "loading", label: `Receiving ${assetTag}...` });
        const result = await postWorkflow("receive", {
          asset_tag: assetTag,
          serial: serial.trim(),
          model: model.trim(),
          manufacturer: manufacturer.trim(),
          asset_class: assetClass,
          location,
          user_id: getCurrentUserId(),
          scan_payload: rawTag,
        });
        setStatus({ kind: "success", result });
      } catch (error) {
        setStatus({
          kind: "error",
          error:
            error instanceof Error
              ? { code: "local_validation", message: error.message }
              : (error as WorkflowFailure["error"]),
        });
      }
    },
    [assetClass, locationRaw, manufacturer, model, serial],
  );

  return (
    <WorkflowShell
      title="Receive asset"
      eyebrow="Dock"
      status={status}
    >
      <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Serial" value={serial} onChange={setSerial} />
          <Field label="Model" value={model} onChange={setModel} />
          <Field
            label="Manufacturer"
            value={manufacturer}
            onChange={setManufacturer}
          />
          <SelectField
            label="Class"
            value={assetClass}
            options={[
              "compute",
              "instrument",
              "network",
              "power",
              "consumable_durable",
            ]}
            onChange={setAssetClass}
          />
          <div className="sm:col-span-2">
            <Field
              label="Receiving location"
              value={locationRaw}
              onChange={setLocationRaw}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SecondaryButton
            disabled={disabled}
            onClick={() => setLocationRaw(RECEIVE_LOCATION)}
          >
            Dock 1
          </SecondaryButton>
          <SecondaryButton
            disabled={disabled}
            onClick={() => setSerial(`SN-DEMO-${Date.now().toString().slice(-5)}`)}
          >
            Fresh serial
          </SecondaryButton>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <ScanInput
              label="Asset tag"
              placeholder="Scan C0009001"
              disabled={disabled}
              onScan={(value) => void submitTag(value)}
            />
          </div>
          <CameraScanButton disabled={disabled} onScan={(value) => void submitTag(value)} />
        </div>
      </div>
    </WorkflowShell>
  );
}

function MoveWorkflow({
  action,
  title,
  eyebrow,
  defaultLocation,
  requireRu,
}: {
  action: "store" | "deploy";
  title: string;
  eyebrow: string;
  defaultLocation: string;
  requireRu: boolean;
}) {
  const [assetTag, setAssetTag] = useState<string | null>(null);
  const [locationRaw, setLocationRaw] = useState(defaultLocation);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const disabled = status.kind === "loading";

  const submit = useCallback(
    async (rawLocation: string): Promise<void> => {
      if (!assetTag) {
        setLocalError(setStatus, "Scan an asset tag first.");
        return;
      }
      try {
        const location = parseLocationScan(rawLocation);
        const missing = requireRu ? ensureDeployLocation(location) : null;
        if (missing) {
          setLocalError(setStatus, missing, "incomplete_location");
          return;
        }

        setStatus({
          kind: "loading",
          label: `${action === "deploy" ? "Deploying" : "Storing"} ${assetTag}...`,
        });
        const result = await postWorkflow(action, {
          asset_tag: assetTag,
          location,
          user_id: getCurrentUserId(),
          scan_payload: `${assetTag}|${rawLocation}`,
        });
        setStatus({ kind: "success", result });
        setAssetTag(null);
      } catch (error) {
        setStatus({
          kind: "error",
          error:
            error instanceof Error
              ? { code: "local_validation", message: error.message }
              : (error as WorkflowFailure["error"]),
        });
      }
    },
    [action, assetTag, requireRu],
  );

  const handleScan = useCallback(
    (value: string): void => {
      if (!assetTag) {
        try {
          setAssetTag(tagOrError(value));
          setStatus({ kind: "idle" });
        } catch (error) {
          setLocalError(
            setStatus,
            error instanceof Error ? error.message : "Invalid asset tag.",
          );
        }
        return;
      }
      setLocationRaw(value);
      void submit(value);
    },
    [assetTag, submit],
  );

  return (
    <WorkflowShell title={title} eyebrow={eyebrow} status={status}>
      <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <DetailPill label="Step 1" value={assetTag ?? "Awaiting asset"} />
          <DetailPill label="Step 2" value="Location" />
          <DetailPill label="Mode" value={requireRu ? "Rack + RU" : "Storage"} />
        </div>
        {assetTag ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <SecondaryButton disabled={disabled} onClick={() => setAssetTag(null)}>
              Rescan asset
            </SecondaryButton>
          </div>
        ) : null}
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <ScanInput
              label={assetTag ? "Location" : "Asset tag"}
              placeholder={
                assetTag
                  ? requireRu
                    ? "Scan Lab-Building-A/Bay-12/Aisle-3/B-04/U21"
                    : "Scan Lab-Building-A/Storage-1/SHELF-3"
                  : "Scan C0009001"
              }
              disabled={disabled}
              onScan={handleScan}
            />
          </div>
          <CameraScanButton disabled={disabled} onScan={handleScan} />
        </div>
        <div className="mt-4">
          <Field
            label="Manual location"
            value={locationRaw}
            onChange={setLocationRaw}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SecondaryButton
            disabled={disabled}
            onClick={() => setLocationRaw(defaultLocation)}
          >
            Preset
          </SecondaryButton>
          <PrimaryButton
            disabled={disabled || !assetTag}
            onClick={() => void submit(locationRaw)}
          >
            Commit
          </PrimaryButton>
        </div>
      </div>
    </WorkflowShell>
  );
}

export function StoreWorkflow() {
  return (
    <MoveWorkflow
      action="store"
      title="Store asset"
      eyebrow="Inventory"
      defaultLocation={STORE_LOCATION}
      requireRu={false}
    />
  );
}

export function DeployWorkflow() {
  return (
    <MoveWorkflow
      action="deploy"
      title="Deploy asset"
      eyebrow="Rack"
      defaultLocation={DEPLOY_LOCATION}
      requireRu
    />
  );
}

export function TransferWorkflow() {
  const [assetTag, setAssetTag] = useState<string | null>(null);
  const [badge, setBadge] = useState("tech-mike");
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const disabled = status.kind === "loading";

  const currentUser = useMemo(() => getCurrentUserId(), []);

  const submitBadge = useCallback(
    async (rawBadge: string): Promise<void> => {
      if (!assetTag) {
        setLocalError(setStatus, "Scan an asset tag first.");
        return;
      }
      const toCustodian = normalizeBadge(rawBadge);
      if (!toCustodian) {
        setLocalError(setStatus, "Receiving badge is empty.");
        return;
      }
      setStatus({ kind: "loading", label: `Transferring ${assetTag}...` });
      try {
        const result = await postWorkflow("transfer", {
          asset_tag: assetTag,
          to_custodian: toCustodian,
          user_id: currentUser,
          scan_payload: `${assetTag}|${rawBadge}`,
        });
        setStatus({ kind: "success", result });
        setAssetTag(null);
      } catch (error) {
        setStatus({ kind: "error", error: error as WorkflowFailure["error"] });
      }
    },
    [assetTag, currentUser],
  );

  const handleScan = useCallback(
    (value: string): void => {
      if (!assetTag) {
        try {
          setAssetTag(tagOrError(value));
          setStatus({ kind: "idle" });
        } catch (error) {
          setLocalError(
            setStatus,
            error instanceof Error ? error.message : "Invalid asset tag.",
          );
        }
        return;
      }
      setBadge(normalizeBadge(value));
      void submitBadge(value);
    },
    [assetTag, submitBadge],
  );

  return (
    <WorkflowShell
      title="Transfer custody"
      eyebrow={`From ${currentUser}`}
      status={status}
    >
      <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <DetailPill label="Step 1" value={assetTag ?? "Awaiting asset"} />
          <DetailPill label="From" value={currentUser} />
          <DetailPill label="To" value={badge} />
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <ScanInput
              label={assetTag ? "Receiving badge" : "Asset tag"}
              placeholder={assetTag ? "Scan tech-mike" : "Scan C0009001"}
              disabled={disabled}
              onScan={handleScan}
            />
          </div>
          <CameraScanButton disabled={disabled} onScan={handleScan} />
        </div>
        <div className="mt-4">
          <Field label="Manual badge" value={badge} onChange={setBadge} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {BADGE_PRESETS.map((preset) => (
            <SecondaryButton
              key={preset}
              disabled={disabled}
              onClick={() => setBadge(preset)}
            >
              {preset}
            </SecondaryButton>
          ))}
          <PrimaryButton
            disabled={disabled || !assetTag}
            onClick={() => void submitBadge(badge)}
          >
            Commit
          </PrimaryButton>
        </div>
      </div>
    </WorkflowShell>
  );
}
