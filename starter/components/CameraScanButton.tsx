"use client";

import { useEffect, useRef, useState } from "react";

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
};
type BarcodeDetectorConstructor = {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const capturedRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function start(): Promise<void> {
      setError(null);
      setHint("Hold the code inside the frame.");
      capturedRef.current = false;
      if (!window.BarcodeDetector) {
        setError("Camera scanning needs Chrome or Edge. The scanner input is ready.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const requestedFormats = ["qr_code", "code_128"];
        const supportedFormats =
          (await window.BarcodeDetector.getSupportedFormats?.()) ??
          requestedFormats;
        const formats = requestedFormats.filter((format) =>
          supportedFormats.includes(format),
        );
        if (!formats.length) {
          setError("This browser camera cannot read QR or Code128 codes.");
          return;
        }

        const detector = new window.BarcodeDetector({
          formats,
        });

        const tick = async (): Promise<void> => {
          const currentVideo = videoRef.current;
          if (!currentVideo || cancelled) return;
          try {
            const codes = await detector.detect(currentVideo);
            const first = codes[0]?.rawValue?.trim();
            if (first && !capturedRef.current) {
              capturedRef.current = true;
              setHint("Captured. Closing camera...");
              onScan(first);
              setOpen(false);
              return;
            }
          } catch {
            setError("Point the camera at one clear code.");
          }
          frameRef.current = window.requestAnimationFrame(() => {
            void tick();
          });
        };

        frameRef.current = window.requestAnimationFrame(() => {
          void tick();
        });
      } catch {
        setError("Camera permission was not available. The scanner input is ready.");
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [onScan, open]);

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

      {open ? (
        <div className="fixed inset-0 z-50 bg-[#030712]/95 p-4 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-md flex-col gap-3">
            <div className="flex items-center justify-between text-white">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-cyan-100/60">
                  Camera scanner
                </div>
                <div className="mt-1 text-sm font-semibold">Scan code</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[44px] rounded-lg border border-white/20 bg-white/[0.04] px-4 text-sm font-semibold transition hover:bg-white/[0.08]"
              >
                Close
              </button>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-8 rounded-2xl border border-cyan-100/70 shadow-[0_0_0_999px_rgba(0,0,0,0.32)]">
                <div className="scan-line absolute left-4 right-4 top-1/2 h-0.5 bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
              </div>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/[0.06] p-3 text-sm text-white">
              {hint}
            </div>
            {error ? (
              <div className="rounded-xl border border-amber-300/25 bg-amber-300/[0.08] p-3 text-sm text-amber-100">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
