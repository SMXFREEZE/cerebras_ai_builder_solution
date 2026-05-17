"use client";

import type { IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function CameraScanButton({
  onScan,
  disabled = false,
  label = "Camera",
}: {
  onScan: (value: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState("Hold the code inside the frame.");
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const capturedRef = useRef(false);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const stopScanner = (): void => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };

    async function start(): Promise<void> {
      setError(null);
      setHint("Starting camera scanner...");
      capturedRef.current = false;

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera scanning needs a browser with camera access. The scanner input is ready.",
        );
        return;
      }

      try {
        const video = videoRef.current;
        if (!video) return;

        const [
          { BrowserMultiFormatReader },
          { BarcodeFormat, DecodeHintType },
        ] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);

        if (cancelled) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.CODE_128,
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.PDF_417,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.ITF,
        ]);
        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 120,
          delayBetweenScanSuccess: 250,
          tryPlayVideoTimeout: 8000,
        });

        setHint(
          "Hold a QR, Data Matrix, PDF417, or linear asset barcode inside the frame.",
        );

        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          },
          video,
          (result, err, scanControls) => {
            if (capturedRef.current || cancelled) return;

            const value = result?.getText().trim();
            if (value) {
              capturedRef.current = true;
              setHint("Captured. Closing camera...");
              scanControls.stop();
              onScanRef.current(value);
              setOpen(false);
              return;
            }

            if (err && err.name !== "NotFoundException") {
              setHint("Move closer and keep one clear code inside the frame.");
            }
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch {
        if (!cancelled) {
          setError(
            "Camera permission or scanner startup was not available. The scanner input is ready.",
          );
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [open]);

  const scannerDialog = open ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Camera scanner"
      className="fixed inset-0 z-[100] h-[100dvh] overflow-hidden bg-[#030712]/95 px-3 backdrop-blur-xl sm:px-4"
      style={{
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto grid h-full max-w-md grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-2 sm:gap-3">
        <div className="flex items-center justify-between gap-3 text-white">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-100/60 sm:text-[11px]">
              Camera scanner
            </div>
            <div className="mt-1 text-sm font-semibold">Scan code</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-[44px] shrink-0 rounded-lg border border-white/20 bg-white/[0.04] px-4 text-sm font-semibold transition hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>
        <div className="relative min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
          <video
            ref={videoRef}
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-5 rounded-2xl border border-cyan-100/70 shadow-[0_0_0_999px_rgba(0,0,0,0.32)] sm:inset-8">
            <div className="scan-line absolute left-4 right-4 top-1/2 h-0.5 bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
          </div>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/[0.06] p-3 text-[13px] leading-relaxed text-white sm:text-sm">
          {hint}
        </div>
        {error ? (
          <div className="rounded-xl border border-amber-300/25 bg-amber-300/[0.08] p-3 text-[13px] leading-relaxed text-amber-100 sm:text-sm">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label="Open camera scanner"
        className="min-h-[58px] rounded-xl border border-cyan-200/20 bg-cyan-200/[0.06] px-4 text-sm font-semibold text-cyan-50 shadow-[0_0_24px_rgba(125,211,252,0.06)] transition hover:border-cyan-200/35 hover:bg-cyan-200/[0.10] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>

      {mounted && scannerDialog
        ? createPortal(scannerDialog, document.body)
        : null}
    </>
  );
}
