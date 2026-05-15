"use client";

import { useEffect, useRef, useState } from "react";

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
};
type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function start(): Promise<void> {
      setError(null);
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

        const detector = new window.BarcodeDetector({
          formats: ["qr_code", "code_128"],
        });

        const tick = async (): Promise<void> => {
          const currentVideo = videoRef.current;
          if (!currentVideo || cancelled) return;
          try {
            const codes = await detector.detect(currentVideo);
            const first = codes[0]?.rawValue?.trim();
            if (first) {
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
        className="min-h-[44px] rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-gray-950/90 p-4">
          <div className="mx-auto flex h-full max-w-md flex-col gap-3">
            <div className="flex items-center justify-between text-white">
              <div className="text-sm font-semibold">Scan code</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[44px] rounded-md border border-white/30 px-4 text-sm font-semibold"
              >
                Close
              </button>
            </div>
            <video
              ref={videoRef}
              muted
              playsInline
              className="min-h-0 flex-1 rounded-md bg-black object-cover"
            />
            {error ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
