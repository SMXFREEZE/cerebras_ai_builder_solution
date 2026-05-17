"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ScanInput } from "@/components/ScanInput";
import { StateBadge } from "@/components/StatusBadge";
import { stateLabel } from "@/lib/format";
import {
  locationLabel,
  looksLikeAssetTag,
  normalizeScan,
} from "@/lib/locations";
import type { Asset } from "@/lib/types";

export type WorkflowAction = "receive" | "store" | "deploy" | "transfer";

export type WorkflowSuccess = {
  asset: Asset;
  message: string;
  sideEffects?: string[];
};

export type WorkflowFailure = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type FormStatus =
  | { kind: "idle" }
  | { kind: "loading"; label: string }
  | { kind: "success"; result: WorkflowSuccess }
  | { kind: "error"; error: WorkflowFailure["error"] };

export async function postWorkflow(
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

export async function fetchAsset(tag: string): Promise<Asset | null> {
  try {
    const res = await fetch(`/api/upstream/assets/${tag}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Asset;
  } catch {
    return null;
  }
}

export function setLocalError(
  setStatus: (status: FormStatus) => void,
  message: string,
  code = "local_validation",
) {
  setStatus({ kind: "error", error: { code, message } });
}

export function tagOrError(raw: string): string {
  const tag = normalizeScan(raw).toUpperCase();
  if (!looksLikeAssetTag(tag)) {
    throw new Error("Asset tags look like C0009001. Try again.");
  }
  return tag;
}

export function Shell({
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
  children: ReactNode;
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
          {"\u2190"} All flows
        </Link>
      </header>

      <Steps
        labels={steps}
        current={currentStep}
        done={status.kind === "success"}
      />
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
      {labels.map((label, index) => {
        const isDone = done || index < current;
        const isActive = !done && index === current;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={
                "step-dot " +
                (isDone ? "step-dot-done" : isActive ? "step-dot-active" : "")
              }
            >
              {isDone ? "\u2713" : index + 1}
            </span>
            <span
              className={
                isActive ? "text-white" : isDone ? "text-emerald-200" : ""
              }
            >
              {label}
            </span>
            {index < labels.length - 1 ? (
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
        <div className="text-[15px] font-medium text-rose-100">
          {error.message}
        </div>
        <code className="font-mono text-[11px] text-rose-200/70">
          {error.code}
        </code>
      </div>
      {expected || provided ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Pill label="Expected serial" value={String(expected ?? "\u2014")} />
          <Pill label="Scanned serial" value={String(provided ?? "\u2014")} />
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
          {"\u2713"}
        </span>
        <span className="text-[15px] font-medium text-emerald-100">
          {result.message}
        </span>
        <StateBadge state={result.asset.state} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Pill label="Asset" value={result.asset.asset_tag} />
        <Pill label="Custodian" value={result.asset.custodian} />
        <Pill label="Location" value={locationLabel(result.asset.location)} />
      </div>
      {result.sideEffects?.length ? (
        <div className="mt-4 rounded-lg border hairline bg-white/[0.02] p-3 font-mono text-[12px] text-[var(--text-dim)]">
          {result.sideEffects.map((sideEffect) => (
            <div key={sideEffect} className="flex items-start gap-2 py-0.5">
              <span className="text-[var(--text-mute)]">{"\u203A"}</span>
              <span>{sideEffect}</span>
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
      <div className="mt-1 break-words font-mono text-[13px] text-white">
        {value}
      </div>
    </div>
  );
}

export function AssetPreview({ asset }: { asset: Asset }) {
  return (
    <div className="rounded-xl border hairline bg-white/[0.015] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[15px] text-white">
          {asset.asset_tag}
        </div>
        <StateBadge state={asset.state} />
      </div>
      <dl className="mt-4 grid gap-3 text-[12px] sm:grid-cols-3">
        <Pill label="Model" value={`${asset.manufacturer} ${asset.model}`} />
        <Pill label="Custodian" value={asset.custodian} />
        <Pill label="Location" value={locationLabel(asset.location)} />
      </dl>
    </div>
  );
}

export function ScanCard({ children }: { children: ReactNode }) {
  return (
    <div className="card-sweep relative overflow-hidden rounded-xl border hairline bg-gradient-to-b from-white/[0.035] to-white/[0.012] p-5">
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function ChipButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: ReactNode;
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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${tone}`}
    >
      {children}
    </button>
  );
}

export function FieldText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-dark"
      />
    </label>
  );
}

export function FieldSelect<T extends string>({
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
      <span className="mb-1.5 block text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--text-mute)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="input-dark"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#0a0a0a]">
            {option.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

export { ScanInput };
