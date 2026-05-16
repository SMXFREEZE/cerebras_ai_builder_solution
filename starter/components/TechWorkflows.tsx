"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CameraScanButton } from "@/components/CameraScanButton";
import { ScanInput } from "@/components/ScanInput";
import { StateBadge } from "@/components/StatusBadge";
import { getCurrentUserId, roleUserId } from "@/lib/auth";
import { stateLabel } from "@/lib/format";
import {
  ensureDeployLocation,
  locationLabel,
  looksLikeAssetTag,
  normalizeBadge,
  normalizeScan,
  parseLocationScan,
} from "@/lib/locations";
import type { Asset, AssetClass } from "@/lib/types";

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

async function fetchAsset(tag: string): Promise<Asset | null> {
  try {
    const res = await fetch(`/api/upstream/assets/${tag}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Asset;
  } catch {
    return null;
  }
}

function Shell({
  title,
  eyebrow,
  steps,
  currentStep,
  status,
  children,
}: {
  title: string;
  eyebrow: string;
  steps: string[];
  currentStep: number;
  status: FormStatus;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            {eyebrow}
          </p>
          <h1 className="display mt-3 text-3xl sm:text-4xl">{title}</h1>
        </div>
        <Link
          href="/tech"
          className="inline-flex h-9 items-center rounded-lg border border-[var(--border-strong)] bg-white/[0.02] px-3 text-[13px] text-[var(--text-dim)] transition hover:bg-white/[0.05] hover:text-white"
        >
          ← All flows
        </Link>
      </header>

      <Steps labels={steps} current={currentStep} done={status.kind === "success"} />
      {children}
      <StatusPanel status={status} />
    </div>
  );
}

function Steps({
  labels,
  current,
  done,
}: {
  labels: string[];
  current: number;
  done: boolean;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--text-dim)]">
      {labels.map((label, i) => {
        const isDone = done || i < current;
        const isActive = !done && i === current;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={
                "step-dot " +
                (isDone ? "step-dot-done" : isActive ? "step-dot-active" : "")
              }
            >
              {isDone ? "✓" : i + 1}
            </span>
            <span className={isActive ? "text-white" : isDone ? "text-emerald-200" : ""}>
              {label}
            </span>
            {i < labels.length - 1 ? (
              <span className="h-px w-8 bg-[var(--border)]" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function StatusPanel({ status }: { status: FormStatus }) {
  if (status.kind === "idle") return null;
  if (status.kind === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-xl border hairline bg-white/[0.02] px-5 py-4 text-[14px] text-[var(--text-dim)]">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
        {status.label}
      </div>
    );
  }
  if (status.kind === "error") return <ErrorPanel error={status.error} />;
  return <SuccessPanel result={status.result} />;
}

function ErrorPanel({ error }: { error: WorkflowFailure["error"] }) {
  const expected = error.details?.expected_serial;
  const provided = error.details?.provided_serial;
  const fromState = error.details?.from_state;
  return (
    <div className="shake-error rounded-xl border border-rose-300/25 bg-rose-300/[0.04] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[15px] font-medium text-rose-100">{error.message}</div>
        <code className="font-mono text-[11px] text-rose-200/70">{error.code}</code>
      </div>
      {expected || provided ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Pill label="Expected serial" value={String(expected ?? "—")} />
          <Pill label="Scanned serial" value={String(provided ?? "—")} />
        </div>
      ) : null}
      {fromState ? (
        <div className="mt-4">
          <Pill label="Current state" value={stateLabel(String(fromState))} />
        </div>
      ) : null}
      <div className="mt-4 text-[12px] text-[var(--text-mute)]">
        Tap the scan field above and try again. Nothing was written.
      </div>
    </div>
  );
}

function SuccessPanel({ result }: { result: WorkflowSuccess }) {
  return (
    <div className="flash-success rounded-xl border border-emerald-300/25 bg-emerald-300/[0.04] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-300/20 text-[12px] text-emerald-200">
          ✓
        </span>
        <span className="text-[15px] font-medium text-emerald-100">{result.message}</span>
        <StateBadge state={result.asset.state} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Pill label="Asset" value={result.asset.asset_tag} />
        <Pill label="Custodian" value={result.asset.custodian} />
        <Pill label="Location" value={locationLabel(result.asset.location)} />
      </div>
      {result.sideEffects?.length ? (
        <div className="mt-4 rounded-lg border hairline bg-white/[0.02] p-3 font-mono text-[12px] text-[var(--text-dim)]">
          {result.sideEffects.map((s, i) => (
            <div key={i} className="flex items-start gap-2 py-0.5">
              <span className="text-[var(--text-mute)]">›</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border hairline bg-white/[0.015] px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {label}
      </div>
      <div className="mt-1 break-words font-mono text-[13px] text-white">{value}</div>
    </div>
  );
}

function AssetPreview({ asset }: { asset: Asset }) {
  return (
    <div className="rounded-xl border hairline bg-white/[0.015] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[15px] text-white">{asset.asset_tag}</div>
        <StateBadge state={asset.state} />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3 text-[12px]">
        <Pill label="Model" value={`${asset.manufacturer} ${asset.model}`} />
        <Pill label="Custodian" value={asset.custodian} />
        <Pill label="Location" value={locationLabel(asset.location)} />
      </dl>
    </div>
  );
}

function ScanCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-sweep relative overflow-hidden rounded-xl border hairline bg-gradient-to-b from-white/[0.035] to-white/[0.012] p-5">
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function ChipButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const base =
    "inline-flex h-9 items-center rounded-lg px-3 text-[13px] transition disabled:cursor-not-allowed disabled:opacity-50";
  const tone = primary
    ? "bg-white text-[#0a0a0a] hover:bg-white/90"
    : "border border-[var(--border-strong)] bg-white/[0.02] text-[var(--text-dim)] hover:bg-white/[0.05] hover:text-white";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${tone}`}>
      {children}
    </button>
  );
}

function FieldText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-dark"
      />
    </label>
  );
}

function FieldSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="input-dark"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0a0a0a]">
            {o.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function setLocalError(setStatus: (s: FormStatus) => void, message: string, code = "local_validation") {
  setStatus({ kind: "error", error: { code, message } });
}

function tagOrError(raw: string): string {
  const tag = normalizeScan(raw).toUpperCase();
  if (!looksLikeAssetTag(tag)) {
    throw new Error("Asset tags look like C0009001. Try again.");
  }
  return tag;
}

// -- Receive --------------------------------------------------------------

export function ReceiveWorkflow() {
  const [serial, setSerial] = useState("SN-DEMO-1");
  const [model, setModel] = useState("CS-3 module");
  const [manufacturer, setManufacturer] = useState("Cerebras");
  const [assetClass, setAssetClass] = useState<AssetClass>("compute");
  const [locationRaw, setLocationRaw] = useState(RECEIVE_LOCATION);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const disabled = status.kind === "loading";

  const submitTag = useCallback(
    async (rawTag: string) => {
      try {
        const assetTag = tagOrError(rawTag);
        const location = parseLocationScan(locationRaw);
        setStatus({ kind: "loading", label: `Receiving ${assetTag}…` });
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
    <Shell
      title="Receive at the dock"
      eyebrow="Step into the inbound flow"
      steps={["Item details", "Scan tag"]}
      currentStep={1}
      status={status}
    >
      <ScanCard>
        <div className="mb-1 text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
          1 · Inbound details
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldText label="Serial" value={serial} onChange={setSerial} />
          <FieldText label="Model" value={model} onChange={setModel} />
          <FieldText label="Manufacturer" value={manufacturer} onChange={setManufacturer} />
          <FieldSelect
            label="Class"
            value={assetClass}
            options={["compute", "instrument", "network", "power", "consumable_durable"]}
            onChange={setAssetClass}
          />
          <div className="sm:col-span-2">
            <FieldText label="Receiving location" value={locationRaw} onChange={setLocationRaw} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ChipButton disabled={disabled} onClick={() => setLocationRaw(RECEIVE_LOCATION)}>
            Dock 1
          </ChipButton>
          <ChipButton
            disabled={disabled}
            onClick={() => setSerial(`SN-DEMO-${Date.now().toString().slice(-5)}`)}
          >
            Fresh serial
          </ChipButton>
        </div>
      </ScanCard>

      <ScanCard>
        <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
          2 · Scan tag
        </div>
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <ScanInput
              label="Asset tag"
              placeholder="Scan C0009001 — press Enter"
              disabled={disabled}
              onScan={(v) => void submitTag(v)}
            />
          </div>
          <CameraScanButton disabled={disabled} onScan={(v) => void submitTag(v)} />
        </div>
        <div className="mt-3 text-[12px] text-[var(--text-mute)]">
          Existing tag with matching serial → idempotent. Different serial → blocked.
        </div>
      </ScanCard>
    </Shell>
  );
}

// -- Store / Deploy (two-step asset → location) --------------------------

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
  const [assetPreview, setAssetPreview] = useState<Asset | null>(null);
  const [locationRaw, setLocationRaw] = useState(defaultLocation);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const disabled = status.kind === "loading";

  useEffect(() => {
    if (!assetTag) {
      setAssetPreview(null);
      return;
    }
    let cancelled = false;
    void fetchAsset(assetTag).then((a) => {
      if (!cancelled) setAssetPreview(a);
    });
    return () => {
      cancelled = true;
    };
  }, [assetTag]);

  const submit = useCallback(
    async (rawLocation: string) => {
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
          label: `${action === "deploy" ? "Deploying" : "Storing"} ${assetTag}…`,
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
    (value: string) => {
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

  const stepIdx = assetTag ? 1 : 0;

  return (
    <Shell
      title={title}
      eyebrow={eyebrow}
      steps={["Scan asset", requireRu ? "Scan rack" : "Scan shelf"]}
      currentStep={stepIdx}
      status={status}
    >
      {assetPreview ? <AssetPreview asset={assetPreview} /> : null}

      <ScanCard>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            {assetTag ? "2 · Destination" : "1 · Asset"}
          </div>
          {assetTag && (
            <ChipButton disabled={disabled} onClick={() => setAssetTag(null)}>
              Rescan asset
            </ChipButton>
          )}
        </div>
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <ScanInput
              label={assetTag ? "Location" : "Asset tag"}
              placeholder={
                assetTag
                  ? requireRu
                    ? "Scan Lab-Building-A/Bay-12/Aisle-3/B-04/U21"
                    : "Scan Lab-Building-A/Storage-1/SHELF-3"
                  : "Scan C0009001 — press Enter"
              }
              disabled={disabled}
              onScan={handleScan}
            />
          </div>
          <CameraScanButton disabled={disabled} onScan={handleScan} />
        </div>

        {assetTag && (
          <>
            <div className="mt-4">
              <FieldText label="Or type manually" value={locationRaw} onChange={setLocationRaw} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ChipButton disabled={disabled} onClick={() => setLocationRaw(defaultLocation)}>
                Use preset
              </ChipButton>
              <ChipButton
                disabled={disabled || !assetTag}
                onClick={() => void submit(locationRaw)}
                primary
              >
                Commit →
              </ChipButton>
            </div>
            {requireRu && (
              <div className="mt-3 text-[12px] text-[var(--text-mute)]">
                Deploy requires site, room, rack, and RU. Anything missing → API rejects with{" "}
                <code className="font-mono">incomplete_deploy_location</code>.
              </div>
            )}
          </>
        )}
      </ScanCard>
    </Shell>
  );
}

export function StoreWorkflow() {
  return (
    <MoveWorkflow
      action="store"
      title="Store on the shelf"
      eyebrow="From dock or rack into inventory"
      defaultLocation={STORE_LOCATION}
      requireRu={false}
    />
  );
}

export function DeployWorkflow() {
  return (
    <MoveWorkflow
      action="deploy"
      title="Deploy to a rack"
      eyebrow="Into service · capitalizes the asset"
      defaultLocation={DEPLOY_LOCATION}
      requireRu
    />
  );
}

// -- Transfer --------------------------------------------------------------

export function TransferWorkflow() {
  const [assetTag, setAssetTag] = useState<string | null>(null);
  const [assetPreview, setAssetPreview] = useState<Asset | null>(null);
  const [badge, setBadge] = useState("tech-mike");
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const disabled = status.kind === "loading";

  const [currentUser, setCurrentUser] = useState(() => roleUserId("tech"));

  useEffect(() => {
    setCurrentUser(getCurrentUserId());
  }, []);

  useEffect(() => {
    if (!assetTag) {
      setAssetPreview(null);
      return;
    }
    let cancelled = false;
    void fetchAsset(assetTag).then((a) => {
      if (!cancelled) setAssetPreview(a);
    });
    return () => {
      cancelled = true;
    };
  }, [assetTag]);

  const submitBadge = useCallback(
    async (rawBadge: string) => {
      if (!assetTag) {
        setLocalError(setStatus, "Scan an asset tag first.");
        return;
      }
      const toCustodian = normalizeBadge(rawBadge);
      if (!toCustodian) {
        setLocalError(setStatus, "Receiving badge is empty.");
        return;
      }
      if (toCustodian === currentUser) {
        setLocalError(setStatus, "You can't transfer custody to yourself.", "same_custodian");
        return;
      }
      setStatus({ kind: "loading", label: `Transferring ${assetTag} → ${toCustodian}…` });
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
    (value: string) => {
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
      const normalized = normalizeBadge(value);
      setBadge(normalized);
      void submitBadge(value);
    },
    [assetTag, submitBadge],
  );

  const stepIdx = assetTag ? 1 : 0;

  return (
    <Shell
      title="Transfer custody"
      eyebrow={`Handoff from ${currentUser}`}
      steps={["Scan asset", "Scan receiving badge"]}
      currentStep={stepIdx}
      status={status}
    >
      {assetPreview ? <AssetPreview asset={assetPreview} /> : null}

      <ScanCard>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
            {assetTag ? "2 · Receiving badge" : "1 · Asset"}
          </div>
          {assetTag && (
            <ChipButton disabled={disabled} onClick={() => setAssetTag(null)}>
              Rescan asset
            </ChipButton>
          )}
        </div>
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <ScanInput
              label={assetTag ? "Badge" : "Asset tag"}
              placeholder={assetTag ? "Scan tech-mike / manager-paul" : "Scan C0009001 — press Enter"}
              disabled={disabled}
              onScan={handleScan}
            />
          </div>
          <CameraScanButton disabled={disabled} onScan={handleScan} />
        </div>

        {assetTag && (
          <>
            <div className="mt-4">
              <FieldText label="Or type manually" value={badge} onChange={setBadge} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {BADGE_PRESETS.map((preset) => (
                <ChipButton
                  key={preset}
                  disabled={disabled || preset === currentUser}
                  onClick={() => setBadge(preset)}
                >
                  {preset}
                </ChipButton>
              ))}
              <ChipButton
                disabled={disabled || !assetTag}
                onClick={() => void submitBadge(badge)}
                primary
              >
                Commit →
              </ChipButton>
            </div>
            <div className="mt-3 text-[12px] text-[var(--text-mute)]">
              State stays the same. Only the custodian changes. Transferring to yourself is rejected.
            </div>
          </>
        )}
      </ScanCard>
    </Shell>
  );
}
