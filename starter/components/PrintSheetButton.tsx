"use client";

export function PrintSheetButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center rounded-lg bg-white px-3 text-[13px] font-medium text-[#0a0a0a] transition hover:bg-white/90"
    >
      Print sheet
    </button>
  );
}
