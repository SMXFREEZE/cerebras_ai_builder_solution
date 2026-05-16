import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export const LOOM_FPS = 30;
export const LOOM_WIDTH = 1920;
export const LOOM_HEIGHT = 1080;

const seconds = (value: number) => value * LOOM_FPS;

export const LOOM_DURATION_IN_FRAMES = seconds(264);

type Chapter = {
  start: number;
  end: number;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
};

const chapters: Chapter[] = [
  {
    start: 0,
    end: 24,
    eyebrow: "Proof, not slides",
    title: "Live app walkthrough after reset",
    body: "Playwright drives the real app from the landing page, so the demo starts with the actual product surface instead of a deck.",
    points: ["No static mockup", "Browser video captured from localhost", "Every major challenge surface appears"],
  },
  {
    start: 24,
    end: 45,
    eyebrow: "Technician map",
    title: "Four flows, scoped writes",
    body: "Receive, store, deploy, and transfer each announce what they write so the technician can trust the action.",
    points: ["Receive writes ops", "Deploy writes all three systems", "Transfer only changes custody"],
  },
  {
    start: 45,
    end: 73,
    eyebrow: "Receive",
    title: "Fresh scan, duplicate safety, serial recovery",
    body: "The dock flow captures item details, accepts a fresh tag, accepts the same tag again, then explains a serial conflict with both values visible.",
    points: ["Scanner input stays focused", "Camera fallback exists", "Recovery copy is specific"],
  },
  {
    start: 73,
    end: 97,
    eyebrow: "Store",
    title: "Two-step move with asset preview",
    body: "The preview is the product tradeoff: one cheap read prevents an expensive wrong-shelf walkback.",
    points: ["Scan asset first", "Preview current state", "Then scan shelf"],
  },
  {
    start: 97,
    end: 134,
    eyebrow: "Deploy",
    title: "Validation before side effects",
    body: "A missing rack unit is blocked before writebacks. A complete rack commits ops, facilities, and finance.",
    points: ["Incomplete rack rejected", "Facilities rack assignment written", "Finance capitalization written"],
  },
  {
    start: 134,
    end: 169,
    eyebrow: "Transfer",
    title: "Two-sided custody handoff",
    body: "The logged-in tech is implicit. The receiving badge is explicit. Self-transfer is rejected before a valid handoff succeeds.",
    points: ["From user is automatic", "Receiving badge is scanned", "State stays in service"],
  },
  {
    start: 169,
    end: 194,
    eyebrow: "De-rack",
    title: "Store from in-service clears facilities",
    body: "This covers the easy-to-miss writeback rule: storing a live asset removes its facilities rack assignment while leaving finance alone.",
    points: ["Ops moves to stored", "Facilities rack becomes null", "Finance untouched"],
  },
  {
    start: 194,
    end: 216,
    eyebrow: "Manager",
    title: "Standup brief before table",
    body: "The dashboard opens with the first exception and action counts, then supports search and filtering for the full asset estate.",
    points: ["8:55 AM information design", "Search proves the scanned asset exists", "Clean rows stay quiet"],
  },
  {
    start: 216,
    end: 226,
    eyebrow: "Evidence",
    title: "Asset detail is forensic",
    body: "The detail page shows current placement and the full event log so managers can audit the workflow end to end.",
    points: ["Current state", "Procurement context", "Receive, store, deploy, transfer history"],
  },
  {
    start: 226,
    end: 243,
    eyebrow: "Reconciliation",
    title: "Categorized drift, not raw diff",
    body: "The server route joins operations, facilities, and finance without leaking the API token to the browser.",
    points: ["Fix today", "Needs a human", "Probably fine", "Clean"],
  },
  {
    start: 243,
    end: 264,
    eyebrow: "Reviewer kit",
    title: "Scannable cases for real testing",
    body: "The barcode sheet includes happy path, drifted, disposed, ghost, location, incomplete deploy, and badge cases.",
    points: ["Code 128", "Failure cases included", "Ready to scan from paper or screen"],
  },
];

const colors = {
  bg: "#05080b",
  cyan: "#67e8f9",
  green: "#34d399",
  text: "#f8fafc",
  dim: "rgba(226, 232, 240, 0.76)",
  panel: "rgba(2, 6, 23, 0.92)",
  border: "rgba(103, 232, 249, 0.36)",
};

function currentChapter(t: number): Chapter {
  return chapters.find((chapter) => t >= chapter.start && t < chapter.end) ?? chapters[chapters.length - 1]!;
}

function Background() {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 14% 16%, rgba(34,211,238,0.22), transparent 34%), radial-gradient(circle at 84% 78%, rgba(52,211,153,0.16), transparent 34%), linear-gradient(135deg, #05080b 0%, #061723 55%, #05080b 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(circle at 50% 50%, black, transparent 78%)",
        }}
      />
    </AbsoluteFill>
  );
}

function BrandMark() {
  return (
    <div
      style={{
        position: "absolute",
        top: 38,
        left: 58,
        display: "flex",
        alignItems: "center",
        gap: 14,
        color: colors.text,
        fontSize: 27,
        fontWeight: 800,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          background:
            "linear-gradient(135deg, rgba(103,232,249,0.25), rgba(52,211,153,0.16))",
          boxShadow: "0 0 48px rgba(103,232,249,0.20)",
        }}
      />
      AssetOps
    </div>
  );
}

function BrowserFrame() {
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 104,
        width: 1340,
        height: 804,
        borderRadius: 28,
        overflow: "hidden",
        border: "1px solid rgba(148, 163, 184, 0.30)",
        background: "#020617",
        boxShadow:
          "0 42px 120px rgba(0, 0, 0, 0.54), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 18px",
          background: "linear-gradient(180deg, #111827, #07111c)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.22)",
        }}
      >
        <Dot color="#fb7185" />
        <Dot color="#facc15" />
        <Dot color="#34d399" />
        <div
          style={{
            marginLeft: 16,
            height: 22,
            width: 560,
            borderRadius: 999,
            background: "rgba(255,255,255,0.055)",
            color: "rgba(226,232,240,0.54)",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            paddingLeft: 18,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          }}
        >
          localhost:3000 / live AssetOps recording
        </div>
      </div>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 760,
          overflow: "hidden",
          background: "#030712",
        }}
      >
        <OffthreadVideo
          src={staticFile("walkthrough/app-working.webm")}
          playbackRate={0.31}
          volume={0}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    </div>
  );
}

function Dot({color}: {color: string}) {
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: 999,
        background: color,
        opacity: 0.9,
      }}
    />
  );
}

function CaptionPanel({chapter}: {chapter: Chapter}) {
  const frame = useCurrentFrame();
  const t = frame / LOOM_FPS;
  const local = t - chapter.start;
  const opacity = interpolate(local, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(local, [0, 0.7], [36, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 1440,
        top: 138,
        width: 408,
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          color: colors.cyan,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: 19,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        {chapter.eyebrow}
      </div>
      <div
        style={{
          padding: 28,
          borderRadius: 24,
          border: `1px solid ${colors.border}`,
          background: colors.panel,
          boxShadow:
            "0 32px 100px rgba(0,0,0,0.46), 0 0 80px rgba(103,232,249,0.13)",
        }}
      >
        <div
          style={{
            color: colors.text,
            fontSize: 36,
            lineHeight: 1.08,
            fontWeight: 850,
          }}
        >
          {chapter.title}
        </div>
        <div
          style={{
            marginTop: 18,
            color: colors.dim,
            fontSize: 23,
            lineHeight: 1.36,
          }}
        >
          {chapter.body}
        </div>
        <div style={{marginTop: 24, display: "flex", flexDirection: "column", gap: 13}}>
          {chapter.points.map((point) => (
            <div
              key={point}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 11,
                color: colors.dim,
                fontSize: 24,
                lineHeight: 1.22,
              }}
            >
              <span
                style={{
                  marginTop: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: colors.green,
                  boxShadow: "0 0 24px rgba(52, 211, 153, 0.55)",
                  flex: "0 0 auto",
                }}
              />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Progress({time}: {time: number}) {
  const progress = Math.min(1, time / (LOOM_DURATION_IN_FRAMES / LOOM_FPS));
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        bottom: 54,
        height: 8,
        borderRadius: 999,
        background: "rgba(148, 163, 184, 0.20)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          borderRadius: 999,
          background: `linear-gradient(90deg, ${colors.cyan}, ${colors.green}, #f8fafc)`,
        }}
      />
    </div>
  );
}

export const AssetOpsLoom = () => {
  const frame = useCurrentFrame();
  const t = frame / LOOM_FPS;
  const chapter = currentChapter(t);

  return (
    <AbsoluteFill style={{backgroundColor: colors.bg, color: colors.text}}>
      <Background />
      <Audio src={staticFile("narration/loom-voiceover.wav")} volume={0.96} />
      <Sequence>
        <BrowserFrame />
      </Sequence>
      <BrandMark />
      <CaptionPanel chapter={chapter} />
      <Progress time={t} />
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 936,
          color: "rgba(226,232,240,0.66)",
          fontSize: 18,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        }}
      >
        {"Live demo: scan workflows -> writebacks -> manager evidence -> reconciliation -> barcode kit"}
      </div>
    </AbsoluteFill>
  );
};
