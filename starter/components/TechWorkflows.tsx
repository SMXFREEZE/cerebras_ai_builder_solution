"use client";

import { useCallback, useEffect, useState } from "react";
import { CameraScanButton } from "@/components/CameraScanButton";
import {
  AssetPreview,
  ChipButton,
  FieldSelect,
  FieldText,
  ScanCard,
  ScanInput,
  Shell,
  fetchAsset,
  postWorkflow,
  setLocalError,
  tagOrError,
  type FormStatus,
  type WorkflowFailure,
} from "@/components/workflows/TechWorkflowUi";
import { getCurrentUserId, roleUserId } from "@/lib/auth";
import {
  ensureDeployLocation,
  normalizeBadge,
  parseLocationScan,
} from "@/lib/locations";
import type { Asset, AssetClass } from "@/lib/types";

const RECEIVE_LOCATION = "Lab-Building-A/Receiving/DOCK-1";
const STORE_LOCATION = "Lab-Building-A/Storage-1/SHELF-3";
const DEPLOY_LOCATION = "Lab-Building-A/Bay-12/Aisle-3/B-04/U21";
const BADGE_PRESETS = ["tech-mike", "tech-ana", "manager-paul"];

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
          <FieldText
            label="Manufacturer"
            value={manufacturer}
            onChange={setManufacturer}
          />
          <FieldSelect
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
            <FieldText
              label="Receiving location"
              value={locationRaw}
              onChange={setLocationRaw}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ChipButton
            disabled={disabled}
            onClick={() => setLocationRaw(RECEIVE_LOCATION)}
          >
            Dock 1
          </ChipButton>
          <ChipButton
            disabled={disabled}
            onClick={() =>
              setSerial(`SN-DEMO-${Date.now().toString().slice(-5)}`)
            }
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
          <CameraScanButton
            disabled={disabled}
            onScan={(v) => void submitTag(v)}
          />
        </div>
        <div className="mt-3 text-[12px] text-[var(--text-mute)]">
          Existing tag with matching serial → idempotent. Different serial →
          blocked.
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
              <FieldText
                label="Or type manually"
                value={locationRaw}
                onChange={setLocationRaw}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ChipButton
                disabled={disabled}
                onClick={() => setLocationRaw(defaultLocation)}
              >
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
                Deploy requires site, room, rack, and RU. Anything missing → API
                rejects with{" "}
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
        setLocalError(
          setStatus,
          "You can't transfer custody to yourself.",
          "same_custodian",
        );
        return;
      }
      setStatus({
        kind: "loading",
        label: `Transferring ${assetTag} → ${toCustodian}…`,
      });
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
              placeholder={
                assetTag
                  ? "Scan tech-mike / manager-paul"
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
              <FieldText
                label="Or type manually"
                value={badge}
                onChange={setBadge}
              />
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
              State stays the same. Only the custodian changes. Transferring to
              yourself is rejected.
            </div>
          </>
        )}
      </ScanCard>
    </Shell>
  );
}
