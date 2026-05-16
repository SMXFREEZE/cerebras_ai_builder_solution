import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { SmoothScroll } from "@/components/SmoothScroll";
import { VantaFogBackground } from "@/components/VantaFogBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssetOps for Cerebras manufacturing",
  description: "Premium manufacturing asset tracking workflows.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <SmoothScroll />
        <VantaFogBackground />
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070d]/88 text-white backdrop-blur-xl">
          <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="shrink-0 font-semibold tracking-normal text-white">
              AssetOps
            </Link>
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
                <HeaderLink href="/tech">Tech</HeaderLink>
                <HeaderLink href="/manager">Manager</HeaderLink>
                <HeaderLink href="/manager/reconcile">Reconcile</HeaderLink>
              </nav>
              <RoleSwitcher />
            </div>
          </div>
        </header>
        <main className="page-enter relative z-10 min-h-[calc(100vh-57px)] text-[var(--text)]">
          <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
        </main>
      </body>
    </html>
  );
}

function HeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
    >
      {children}
    </Link>
  );
}
