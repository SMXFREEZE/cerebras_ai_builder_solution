"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type LenisInstance = {
  raf: (time: number) => void;
  destroy: () => void;
};

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    if (
      pathname !== "/" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let active = true;
    let lenis: LenisInstance | null = null;
    let raf = 0;

    const tick = (time: number) => {
      if (!lenis) return;
      lenis.raf(time);
      if (active) raf = window.requestAnimationFrame(tick);
    };

    async function startSmoothScroll(): Promise<void> {
      const { default: Lenis } = await import("lenis");
      if (!active) return;
      lenis = new Lenis({
        duration: 0.62,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1,
      });
      raf = window.requestAnimationFrame(tick);
    }

    void startSmoothScroll();

    return () => {
      active = false;
      if (raf) window.cancelAnimationFrame(raf);
      lenis?.destroy();
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };
  }, [pathname]);

  return null;
}
