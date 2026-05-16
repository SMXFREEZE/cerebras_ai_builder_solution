"use client";

import { useEffect, useRef } from "react";
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

export function VantaFogBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let effect: VantaEffect | null = null;
    let timer: number | null = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    async function mountFog() {
      if (!hostRef.current || reduceMotion.matches) return;

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

    timer = window.setTimeout(() => {
      void mountFog();
    }, 700);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      effect?.destroy();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className="vanta-fog-bg" />;
}
