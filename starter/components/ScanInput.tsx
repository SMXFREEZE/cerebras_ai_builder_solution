"use client";

import { useEffect, useRef } from "react";

export interface ScanInputProps {
  onScan: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  label?: string;
}

function shouldKeepCurrentFocus(active: Element | null): boolean {
  if (!(active instanceof HTMLElement)) return false;
  if (active.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(active.tagName);
}

export function ScanInput({
  onScan,
  placeholder = "Scan or type a tag and press Enter",
  autoFocus = true,
  disabled = false,
  label,
}: ScanInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && ref.current && !disabled) {
      ref.current.focus();
    }
  }, [autoFocus, disabled]);

  // Keep focus on the scanner input — if the tech taps elsewhere, refocus on next keystroke.
  useEffect(() => {
    if (disabled) return;
    const refocus = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const active = document.activeElement;
      if (shouldKeepCurrentFocus(active)) return;
      ref.current?.focus();
    };
    window.addEventListener("keydown", refocus);
    return () => window.removeEventListener("keydown", refocus);
  }, [disabled]);

  function fire(): void {
    const el = ref.current;
    if (!el) return;
    const v = el.value.trim();
    if (!v) return;
    onScan(v);
    el.value = "";
    el.focus();
  }

  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--text-mute)]">
          {label}
        </span>
      ) : null}
      <input
        ref={ref}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        className="scan-input w-full"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            fire();
          }
        }}
      />
    </label>
  );
}
