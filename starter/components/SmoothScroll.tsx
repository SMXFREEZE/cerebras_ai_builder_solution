"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 0.62,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
    });

    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      lenis.destroy();
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };
  }, [pathname]);

  return null;
}
