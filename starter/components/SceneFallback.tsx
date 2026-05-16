export function SceneFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 52%, rgba(224,242,255,0.14), transparent 27%), radial-gradient(circle at 50% 50%, rgba(125,211,252,0.08), transparent 20%)",
      }}
    >
      <div className="hero-loader-glow absolute left-1/2 top-1/2 h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100/[0.035] shadow-[0_0_80px_rgba(125,211,252,0.16)]" />
      <div className="hero-loader-ring hero-loader-ring-slow absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/14" />
      <div className="hero-loader-ring hero-loader-ring-reverse absolute left-1/2 top-1/2 h-[44%] w-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/20" />
      <div className="absolute left-1/2 top-1/2 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100/60 shadow-[0_0_32px_rgba(224,242,255,0.55)]" />
      <div className="absolute left-[26%] top-[37%] h-1 w-1 rounded-full bg-white/35" />
      <div className="absolute right-[25%] top-[58%] h-1 w-1 rounded-full bg-cyan-100/40" />
      <div className="absolute left-[39%] bottom-[24%] h-1 w-1 rounded-full bg-white/25" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 38%, rgba(10,10,10,0.68) 82%)",
        }}
      />
    </div>
  );
}
