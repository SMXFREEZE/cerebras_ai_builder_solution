import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export const LOOM_FPS = 25;
export const LOOM_WIDTH = 1920;
export const LOOM_HEIGHT = 1080;

const frame = (seconds: number) => Math.round(seconds * LOOM_FPS);

type Focus = {
  x: number;
  y: number;
  w: number;
  h: number;
  zoom: number;
};

type BaseScene = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  focus: Focus;
  footnote?: string;
};

type LiveScene = BaseScene & {
  kind: "live";
  sourceStart: number;
  sourceEnd: number;
};

type LensScene = BaseScene & {
  kind: "lens";
  image: string;
  duration: number;
};

type Scene = LiveScene | LensScene;

const scenes: Scene[] = [
  {
    kind: "live",
    sourceStart: 0,
    sourceEnd: 10.2,
    eyebrow: "Founder demo",
    title: "AssetOps turns every scan into evidence",
    body: "The demo starts inside the real product after a reset. The first screen frames the manufacturing problem before we touch a single form.",
    points: ["Playwright-captured product state", "No static mockup", "Problem before feature tour"],
    focus: {x: 46, y: 45, w: 72, h: 62, zoom: 1.08},
    footnote: "YC-style rule used here: make the product clear early, then prove it works.",
  },
  {
    kind: "lens",
    image: "home-systems.jpg",
    duration: 9,
    eyebrow: "Why this matters",
    title: "Three systems drift unless scans write the right places",
    body: "Ops, facilities, and finance disagree in different ways. This opening is not decoration: it tells the reviewer the app is about operational truth, not a pretty inventory table.",
    points: ["Ops owns state and custody", "Facilities owns rack placement", "Finance owns capitalization"],
    focus: {x: 49, y: 73, w: 58, h: 28, zoom: 1.42},
  },
  {
    kind: "live",
    sourceStart: 10.2,
    sourceEnd: 15.94,
    eyebrow: "Technician map",
    title: "Four large actions, one scanner-first console",
    body: "The technician console is intentionally blunt. A gloved tech should not hunt through menus at 11 PM in a dock bay.",
    points: ["Receive", "Store", "Deploy", "Transfer"],
    focus: {x: 50, y: 49, w: 54, h: 45, zoom: 1.2},
  },
  {
    kind: "lens",
    image: "tech-console.jpg",
    duration: 8,
    eyebrow: "Small feature",
    title: "Each card says what it writes before you click",
    body: "This is a trust cue. The card copy sets expectations, so deploy feels riskier than transfer before the tech even opens the flow.",
    points: ["Receive writes ops", "Deploy writes all three systems", "Transfer changes custody only"],
    focus: {x: 50, y: 52, w: 50, h: 44, zoom: 1.55},
  },
  {
    kind: "live",
    sourceStart: 15.94,
    sourceEnd: 22.22,
    eyebrow: "Receive",
    title: "The scan input is the primary control",
    body: "The tag field stays focused for USB and Bluetooth scanners. The camera button keeps the phone path visible without adding driver complexity.",
    points: ["Serial visible before scan", "Focused scan box", "Camera fallback button"],
    focus: {x: 49, y: 65, w: 42, h: 17, zoom: 1.52},
  },
  {
    kind: "lens",
    image: "receive-fields.jpg",
    duration: 10,
    eyebrow: "Tiny button, big reason",
    title: "Camera scan is a first-class option, not a settings page",
    body: "The camera trigger sits beside the scan input because the challenge explicitly allows phones. The UI makes both scanner types feel native.",
    points: ["Desktop scanner types and presses Enter", "Phone camera opens from the same place", "The operator never leaves the flow"],
    focus: {x: 67, y: 65, w: 15, h: 12, zoom: 1.8},
  },
  {
    kind: "live",
    sourceStart: 22.22,
    sourceEnd: 30,
    eyebrow: "Recovery path",
    title: "Duplicate is safe, serial conflict is precise",
    body: "The same tag with the same serial is idempotent. The same tag with a different serial becomes a specific recovery moment.",
    points: ["Happy duplicate accepted", "Bad duplicate rejected", "Both serials shown"],
    focus: {x: 50, y: 74, w: 45, h: 18, zoom: 1.58},
  },
  {
    kind: "lens",
    image: "receive-conflict.jpg",
    duration: 11,
    eyebrow: "Microcopy call",
    title: "Expected serial vs. scanned serial is the sentence that saves time",
    body: "I nearly wrote a generic 'serial mismatch' error. This version gives the tech the two values they need to fix the physical label or the receiving record.",
    points: ["Explains what happened", "Names the bad value", "Turns an error into next action"],
    focus: {x: 50, y: 87, w: 66, h: 14, zoom: 1.08},
    footnote: "This is the microcopy I would call out in the Loom.",
  },
  {
    kind: "live",
    sourceStart: 35,
    sourceEnd: 42.39,
    eyebrow: "Store",
    title: "Two-step storage prevents wrong-shelf moves",
    body: "The first scan loads the asset preview. The second scan commits the shelf. It is one extra read, but it prevents expensive walkbacks.",
    points: ["Scan asset first", "Preview current state", "Then scan shelf"],
    focus: {x: 50, y: 58, w: 48, h: 36, zoom: 1.42},
  },
  {
    kind: "lens",
    image: "store-preview.jpg",
    duration: 9,
    eyebrow: "Interaction detail",
    title: "Preview before commit is the safety rail",
    body: "The confirmation button only appears after the app knows which asset is moving. That keeps accidental shelf scans from becoming silent writes.",
    points: ["Asset context first", "Location context second", "Commit button last"],
    focus: {x: 50, y: 55, w: 46, h: 32, zoom: 1.62},
  },
  {
    kind: "live",
    sourceStart: 45,
    sourceEnd: 53.24,
    eyebrow: "Deploy",
    title: "Deploy blocks incomplete rack data before side effects",
    body: "A rack without RU is rejected before facilities or finance receives a write. The failure happens while it is still cheap.",
    points: ["Rack unit required", "No partial write", "Error is visible in-flow"],
    focus: {x: 49, y: 65, w: 48, h: 22, zoom: 1.5},
  },
  {
    kind: "lens",
    image: "deploy-blocked.jpg",
    duration: 8,
    eyebrow: "Button behavior",
    title: "Confirm stays boring because validation is doing the hard work",
    body: "The user action is simple. The product judgment is behind it: do not let a plausible but incomplete location create downstream drift.",
    points: ["One button", "Strict location grammar", "Clear rollback-free failure"],
    focus: {x: 53, y: 78, w: 42, h: 16, zoom: 1.78},
  },
  {
    kind: "live",
    sourceStart: 55,
    sourceEnd: 58.96,
    eyebrow: "Writebacks",
    title: "A complete deploy writes all three systems",
    body: "The success panel names the exact downstream effects, so the reviewer can see that this is not just a local state change.",
    points: ["Operations: in_service", "Facilities: rack assignment", "Finance: capitalized"],
    focus: {x: 50, y: 77, w: 52, h: 20, zoom: 1.62},
  },
  {
    kind: "lens",
    image: "deploy-writebacks.jpg",
    duration: 11,
    eyebrow: "Proud detail",
    title: "The success copy names the systems that changed",
    body: "Generic success hides risk. 'Facilities rack assignment written' and 'Finance capitalization written' are audit-friendly words.",
    points: ["No vague toast", "Names side effects", "Useful for the manager later"],
    focus: {x: 51, y: 78, w: 54, h: 23, zoom: 1.82},
  },
  {
    kind: "live",
    sourceStart: 60,
    sourceEnd: 73.38,
    eyebrow: "Transfer",
    title: "Custody handoff is two-sided",
    body: "The logged-in tech is the from side. The receiving badge is explicit. The app rejects transferring the asset to yourself.",
    points: ["Badge scan matters", "Self-transfer rejected", "State stays in service"],
    focus: {x: 50, y: 66, w: 50, h: 28, zoom: 1.48},
  },
  {
    kind: "lens",
    image: "transfer-success.jpg",
    duration: 9,
    eyebrow: "State discipline",
    title: "Transfer changes the human, not the asset lifecycle",
    body: "A custody handoff should not accidentally store, deploy, or retire the asset. This is why the success message says transferred, not moved.",
    points: ["From user is automatic", "Receiving party is scanned", "Lifecycle state is unchanged"],
    focus: {x: 52, y: 79, w: 48, h: 18, zoom: 1.72},
  },
  {
    kind: "live",
    sourceStart: 75,
    sourceEnd: 82.53,
    eyebrow: "De-rack",
    title: "Store from in-service clears facilities",
    body: "This edge case is easy to miss. Storing a live asset must remove rack placement while leaving finance alone.",
    points: ["Ops moves to stored", "Facilities rack becomes null", "Finance untouched"],
    focus: {x: 49, y: 70, w: 48, h: 20, zoom: 1.54},
  },
  {
    kind: "lens",
    image: "derack-cleared.jpg",
    duration: 8,
    eyebrow: "Hidden writeback",
    title: "The page proves a negative: finance was not touched",
    body: "The wording separates the facilities cleanup from finance. That prevents a reviewer from assuming every store action has accounting impact.",
    points: ["Facilities cleared", "Finance left alone", "Reconcile stays quiet"],
    focus: {x: 51, y: 79, w: 45, h: 17, zoom: 1.78},
  },
  {
    kind: "live",
    sourceStart: 85,
    sourceEnd: 93.6,
    eyebrow: "Manager",
    title: "The dashboard is built for the 8:55 standup",
    body: "The manager sees the first exception and the counts before the table. Search proves the scanned asset actually exists in the estate.",
    points: ["First exception", "Critical and review counts", "Search and filter"],
    focus: {x: 48, y: 48, w: 68, h: 42, zoom: 1.28},
  },
  {
    kind: "lens",
    image: "manager-standup.jpg",
    duration: 10,
    eyebrow: "Information design",
    title: "Not every row deserves the same attention",
    body: "Clean inventory is deliberately quieter than exceptions. The dashboard helps a manager decide what to do first in under a minute.",
    points: ["Exception first", "Clean count visible", "Table still searchable"],
    focus: {x: 48, y: 49, w: 76, h: 48, zoom: 1.5},
  },
  {
    kind: "live",
    sourceStart: 95,
    sourceEnd: 99.85,
    eyebrow: "Asset evidence",
    title: "The detail page is forensic, not decorative",
    body: "A reviewer can inspect the current placement, custodian, procurement context, and event history for the scanned asset.",
    points: ["Current placement", "Custodian", "Append-only event log"],
    focus: {x: 54, y: 72, w: 62, h: 32, zoom: 1.45},
  },
  {
    kind: "lens",
    image: "asset-event-log.jpg",
    duration: 9,
    eyebrow: "Audit trail",
    title: "Every scan leaves a readable event row",
    body: "The event table is the manager's forensic tool. It makes the live demo defensible because every action creates evidence.",
    points: ["Receive", "Store", "Deploy", "Transfer"],
    focus: {x: 55, y: 75, w: 68, h: 37, zoom: 1.66},
  },
  {
    kind: "live",
    sourceStart: 99.85,
    sourceEnd: 109.81,
    eyebrow: "Reconciliation",
    title: "The report ranks drift by actionability",
    body: "The route joins operations, facilities, and finance server-side, then turns raw differences into manager language.",
    points: ["Fix today", "Needs a human", "Probably fine", "Clean"],
    focus: {x: 50, y: 55, w: 72, h: 50, zoom: 1.34},
  },
  {
    kind: "lens",
    image: "reconcile-categories.jpg",
    duration: 10,
    eyebrow: "Judgment call",
    title: "Categorization is the product, not just the query",
    body: "A raw diff would be technically correct and operationally noisy. The categories tell the Monday manager what to ignore and what to fix.",
    points: ["Server-side token safety", "Human-readable recommendations", "Clean rows separated from exceptions"],
    focus: {x: 50, y: 45, w: 72, h: 42, zoom: 1.56},
  },
  {
    kind: "live",
    sourceStart: 109.81,
    sourceEnd: 117.68,
    eyebrow: "Reviewer kit",
    title: "Barcodes make the demo testable",
    body: "The reviewer can scan happy paths and failure cases from the page, not just trust the video.",
    points: ["Code 128 labels", "Locations and badges", "Disposed, drifted, ghost, incomplete rack cases"],
    focus: {x: 50, y: 45, w: 76, h: 50, zoom: 1.3},
  },
  {
    kind: "lens",
    image: "barcode-kit.jpg",
    duration: 9,
    eyebrow: "Submission detail",
    title: "The sheet includes cases reviewers are likely to try",
    body: "A good take-home makes testing easy. This page turns edge cases into scannable inputs.",
    points: ["Happy path", "Bad inputs", "Manager review cases"],
    focus: {x: 36, y: 34, w: 52, h: 30, zoom: 1.66},
  },
  {
    kind: "live",
    sourceStart: 117.68,
    sourceEnd: 124,
    eyebrow: "Final proof",
    title: "The demo ends on the scanned asset",
    body: "The closing frame returns to C0009001 so the reviewer sees final state and event history after the walkthrough.",
    points: ["In service", "Custodian transferred", "Event log preserved"],
    focus: {x: 54, y: 74, w: 66, h: 36, zoom: 1.42},
  },
  {
    kind: "lens",
    image: "final-proof.jpg",
    duration: 24,
    eyebrow: "Ready to submit",
    title: "A scanner-first system with manager-grade evidence",
    body: "The pitch is simple: fewer skipped scans, fewer silent writeback bugs, and a reconciliation report a manufacturing manager can act on.",
    points: ["Tech workflow", "Manager workflow", "Three-system reconciliation"],
    focus: {x: 54, y: 74, w: 66, h: 36, zoom: 1.34},
    footnote: "Repo, public URL, and Loom link are the three submission fields.",
  },
];

const timeline = scenes.reduce<Array<{scene: Scene; start: number; duration: number}>>(
  (acc, scene) => {
    const duration =
      scene.kind === "live"
        ? frame(scene.sourceEnd - scene.sourceStart)
        : frame(scene.duration);
    const start = acc.reduce((sum, item) => sum + item.duration, 0);
    acc.push({scene, start, duration});
    return acc;
  },
  [],
);

export const LOOM_DURATION_IN_FRAMES = timeline.reduce(
  (sum, item) => sum + item.duration,
  0,
);

const colors = {
  bg: "#05080b",
  cyan: "#67e8f9",
  blue: "#38bdf8",
  green: "#34d399",
  text: "#f8fafc",
  dim: "rgba(226, 232, 240, 0.76)",
  panel: "rgba(2, 6, 23, 0.94)",
  border: "rgba(103, 232, 249, 0.36)",
};

function activeTimeline(frameNumber: number) {
  return (
    timeline.find((item) => frameNumber >= item.start && frameNumber < item.start + item.duration) ??
    timeline[timeline.length - 1]!
  );
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

function productFrame(scene: Scene) {
  if (scene.kind === "lens") {
    return scene.image;
  }

  switch (scene.eyebrow) {
    case "Founder demo":
      return "home-systems.jpg";
    case "Technician map":
      return "tech-console.jpg";
    case "Receive":
      return "receive-fields.jpg";
    case "Recovery path":
      return "receive-conflict.jpg";
    case "Store":
      return "store-preview.jpg";
    case "Deploy":
      return "deploy-blocked.jpg";
    case "Writebacks":
      return "deploy-writebacks.jpg";
    case "Transfer":
      return "transfer-success.jpg";
    case "De-rack":
      return "derack-cleared.jpg";
    case "Manager":
      return "manager-standup.jpg";
    case "Asset evidence":
      return "asset-event-log.jpg";
    case "Reconciliation":
      return "reconcile-categories.jpg";
    case "Reviewer kit":
      return "barcode-kit.jpg";
    case "Final proof":
      return "final-proof.jpg";
    default:
      return "final-proof.jpg";
  }
}

function MediaFrame({
  scene,
  localFrame,
  duration,
}: {
  scene: Scene;
  localFrame: number;
  duration: number;
}) {
  const focus = scene.focus;
  const ramp = Math.min(frame(0.8), Math.floor(duration / 3));
  const scale = interpolate(
    localFrame,
    [0, ramp, Math.max(ramp + 1, duration - ramp), duration],
    [1, focus.zoom, focus.zoom, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

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
      <ChromeBar mode={scene.kind} />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 760,
          overflow: "hidden",
          background: "#030712",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${focus.x}% ${focus.y}%`,
            transform: `scale(${scale})`,
          }}
        >
          <Img
            src={staticFile(`walkthrough/frames/${productFrame(scene)}`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <FocusBox focus={focus} localFrame={localFrame} />
        </div>
      </div>
    </div>
  );
}

function ChromeBar({mode}: {mode: "live" | "lens"}) {
  return (
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
        localhost:3000 / {mode === "live" ? "captured product state" : "zoomed product lens"}
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

function FocusBox({focus, localFrame}: {focus: Focus; localFrame: number}) {
  const glow = interpolate(localFrame % frame(1.4), [0, frame(0.7), frame(1.4)], [0.25, 0.72, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: `${focus.x - focus.w / 2}%`,
          top: `${focus.y - focus.h / 2}%`,
          width: `${focus.w}%`,
          height: `${focus.h}%`,
          borderRadius: 18,
          border: `2px solid rgba(103, 232, 249, ${0.45 + glow * 0.4})`,
          boxShadow: `0 0 ${30 + glow * 44}px rgba(103,232,249,${0.18 + glow * 0.26}), 0 0 0 999px rgba(2,6,23,0.04)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${focus.x}%`,
          top: `${focus.y}%`,
          width: 28 + glow * 18,
          height: 28 + glow * 18,
          marginLeft: -14 - glow * 9,
          marginTop: -14 - glow * 9,
          borderRadius: 999,
          border: `3px solid rgba(52, 211, 153, ${0.55 + glow * 0.35})`,
          background: "rgba(103,232,249,0.14)",
          boxShadow: "0 0 32px rgba(52,211,153,0.42)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

function CaptionPanel({
  scene,
  localFrame,
}: {
  scene: Scene;
  localFrame: number;
}) {
  const opacity = interpolate(localFrame, [0, frame(0.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(localFrame, [0, frame(0.6)], [36, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 1440,
        top: 118,
        width: 408,
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          color: colors.cyan,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        {scene.eyebrow}
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
            fontSize: 33,
            lineHeight: 1.08,
            fontWeight: 850,
          }}
        >
          {scene.title}
        </div>
        <div
          style={{
            marginTop: 17,
            color: colors.dim,
            fontSize: 21,
            lineHeight: 1.36,
          }}
        >
          {scene.body}
        </div>
        <div style={{marginTop: 22, display: "flex", flexDirection: "column", gap: 12}}>
          {scene.points.map((point) => (
            <div
              key={point}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 11,
                color: colors.dim,
                fontSize: 22,
                lineHeight: 1.2,
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
      {scene.footnote ? <Footnote text={scene.footnote} /> : null}
    </div>
  );
}

function Footnote({text}: {text: string}) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: "14px 16px",
        borderRadius: 16,
        color: "rgba(226,232,240,0.74)",
        border: "1px solid rgba(52,211,153,0.24)",
        background: "rgba(5, 46, 22, 0.35)",
        fontSize: 16,
        lineHeight: 1.35,
      }}
    >
      {text}
    </div>
  );
}

function Progress({time}: {time: number}) {
  const progress = Math.min(1, time / LOOM_DURATION_IN_FRAMES);
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
  const frameNumber = useCurrentFrame();
  const {scene, start, duration} = activeTimeline(frameNumber);
  const localFrame = frameNumber - start;

  return (
    <AbsoluteFill style={{backgroundColor: colors.bg, color: colors.text}}>
      <Background />
      <Audio src={staticFile("narration/loom-voiceover.wav")} volume={0.96} />
      {timeline.map((item) => (
        <Sequence key={`${item.scene.title}-${item.start}`} from={item.start} durationInFrames={item.duration}>
          <MediaFrame scene={item.scene} localFrame={frameNumber - item.start} duration={item.duration} />
        </Sequence>
      ))}
      <BrandMark />
      <CaptionPanel scene={scene} localFrame={localFrame} />
      <Progress time={frameNumber} />
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
        {"Playwright-captured product states + zoomed lenses: scan -> writebacks -> evidence -> reconciliation"}
      </div>
    </AbsoluteFill>
  );
};
