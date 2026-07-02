"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tech", label: "Tech" },
  { href: "/manager", label: "Manager" },
  { href: "/manager/reconcile", label: "Reconcile" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();

  // Close the panel whenever navigation happens.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-[40px] w-10 items-center justify-center rounded-md border border-white/15 bg-white/[0.06] text-slate-100 transition hover:border-cyan-200/40 hover:bg-cyan-200/10"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          {open ? (
            <path d="M3 3l10 10M13 3L3 13" />
          ) : (
            <path d="M2 4.5h12M2 8h12M2 11.5h12" />
          )}
        </svg>
      </button>
      {open ? (
        <nav
          id={panelId}
          aria-label="Primary"
          className="absolute inset-x-0 top-full border-b border-white/10 bg-[#05070d]/97 backdrop-blur-xl"
        >
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
