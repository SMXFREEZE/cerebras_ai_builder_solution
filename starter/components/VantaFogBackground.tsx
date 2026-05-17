"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type * as ThreeNamespace from "three";

type ThreeModule = typeof ThreeNamespace;

type VantaEffect = {
  destroy: () => void;
  resize?: () => void;
};

type VantaFogFactory = (options: {
  el: HTMLElement;
  THREE: ThreeModule;
  mouseControls: boolean;
  touchControls: boolean;
  gyroControls: boolean;
  minHeight: number;
  minWidth: number;
  highlightColor: number;
  midtoneColor: number;
  lowlightColor: number;
  baseColor: number;
  blurFactor: number;
  speed: number;
  zoom: number;
  scale: number;
  scaleMobile: number;
}) => VantaEffect;

const PLATFORM_FOG = {
  baseColor: 0x05070d,
  highlightColor: 0xa5f3fc,
  midtoneColor: 0x0ea5e9,
  lowlightColor: 0x14213d,
};

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

function canRunFog(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  if (window.matchMedia("(max-width: 768px), (pointer: coarse)").matches)
    return false;

  const connection = (window.navigator as NavigatorWithConnection).connection;
  return !connection?.saveData;
}

function scheduleIdle(callback: () => void): () => void {
  const idleWindow = window as Window & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
    const id = idleWindow.requestIdleCallback(callback, { timeout: 1200 });
    return () => idleWindow.cancelIdleCallback?.(id);
  }

  const id = globalThis.setTimeout(callback, 900);
  return () => globalThis.clearTimeout(id);
}

export function VantaFogBackground() {
  const pathname = usePathname();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let effect: VantaEffect | null = null;
    let cancelScheduledStart: (() => void) | null = null;

    async function mountFog() {
      if (pathname !== "/" || !hostRef.current || !canRunFog()) return;

      const [mod, THREE] = await Promise.all([
        import("vanta/dist/vanta.fog.min") as Promise<
          { default?: VantaFogFactory } & VantaFogFactory
        >,
        import("three") as Promise<ThreeModule>,
      ]);
      const fog = mod.default ?? mod;

      if (cancelled || !hostRef.current) return;

      effect = fog({
        el: hostRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        ...PLATFORM_FOG,
        blurFactor: 0.56,
        speed: 1.45,
        zoom: 0.72,
        scale: 1,
        scaleMobile: 1,
      });
    }

    cancelScheduledStart = scheduleIdle(() => {
      void mountFog();
    });

    return () => {
      cancelled = true;
      cancelScheduledStart?.();
      effect?.destroy();
    };
  }, [pathname]);

  return <div ref={hostRef} aria-hidden className="vanta-fog-bg" />;
}
