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

export const LOOM_FPS = 30;
export const LOOM_WIDTH = 1920;
export const LOOM_HEIGHT = 1080;

type LoomScene = {
  id: string;
  kind: "title" | "text" | "capture";
  eyebrow: string;
  title: string;
  caption: string;
  duration: number;
  points?: string[];
  image?: string;
  focus?: [number, number];
  zoom?: [number, number];
};

const seconds = (value: number) => value * LOOM_FPS;

const scenes: LoomScene[] = [
  {
    id: "title",
    kind: "title",
    eyebrow: "Cerebras AI Builder Challenge",
    title: "AssetOps",
    caption:
      "A scanner-first asset control tower for manufacturing teams that need operations, facilities, and finance to agree.",
    duration: seconds(16),
    points: ["What I built", "One tradeoff", "One microcopy call"],
  },
  {
    id: "problem",
    kind: "text",
    eyebrow: "Problem",
    title: "Every missed scan becomes drift.",
    caption:
      "Operations owns state, facilities owns rack position, and finance owns capitalization. AssetOps turns one physical scan into aligned records.",
    duration: seconds(18),
    points: ["Techs need low-friction scans", "Managers need action, not raw diffs"],
  },
  {
    id: "product",
    kind: "capture",
    eyebrow: "Product",
    title: "Premium first impression",
    caption:
      "The landing view establishes the product, then quickly points reviewers to the real workflows.",
    image: "01-home.png",
    duration: seconds(16),
    focus: [0.48, 0.48],
    zoom: [1.01, 1.05],
    points: ["Vanta fog atmosphere", "3D asset graph", "Live activity preview"],
  },
  {
    id: "receive",
    kind: "capture",
    eyebrow: "Technician workflow",
    title: "Receive is scanner-first",
    caption:
      "The scan input is focused by default; the camera path is a native fallback for phones.",
    image: "03-receive-success.png",
    duration: seconds(18),
    focus: [0.52, 0.78],
    zoom: [1.02, 1.08],
    points: ["Autofocus and refocus", "Clear receipt state", "Duplicate receives are idempotent"],
  },
  {
    id: "conflict",
    kind: "capture",
    eyebrow: "Recovery",
    title: "Confusing scans explain themselves",
    caption:
      "A serial conflict shows the old and new values so the technician can compare labels instead of guessing.",
    image: "04-serial-conflict.png",
    duration: seconds(18),
    focus: [0.45, 0.82],
    zoom: [1.02, 1.08],
    points: ["No vague failure state", "Recovery path stays on screen"],
  },
  {
    id: "validation",
    kind: "capture",
    eyebrow: "Deploy",
    title: "Bad deploys are blocked early",
    caption:
      "Missing RU is caught before any facilities or finance writeback can run.",
    image: "05-deploy-missing-ru.png",
    duration: seconds(19),
    focus: [0.5, 0.78],
    zoom: [1.02, 1.08],
    points: ["Validate before side effects", "Keep failure local and obvious"],
  },
  {
    id: "microcopy",
    kind: "capture",
    eyebrow: "Microcopy",
    title: "Facilities rack assignment written. Finance capitalization written.",
    caption:
      "This copy names the downstream systems that moved. It is stronger than a generic success message.",
    image: "06-deploy-success.png",
    duration: seconds(30),
    focus: [0.51, 0.84],
    zoom: [1.02, 1.08],
    points: ["One scan, three systems", "Server route keeps token private", "Missing lines would be meaningful"],
  },
  {
    id: "transfer",
    kind: "capture",
    eyebrow: "Custody",
    title: "Transfer is two-sided",
    caption:
      "The logged-in tech is implicit. The receiving badge is explicit, and the asset remains in service.",
    image: "07-transfer-success.png",
    duration: seconds(16),
    focus: [0.5, 0.78],
    zoom: [1.02, 1.08],
    points: ["From side is automatic", "To side is scanned", "State does not change"],
  },
  {
    id: "manager",
    kind: "capture",
    eyebrow: "Manager",
    title: "Standup brief before table",
    caption:
      "The manager sees first actions and metrics before filtering through the asset list.",
    image: "08-manager.png",
    duration: seconds(19),
    focus: [0.5, 0.45],
    zoom: [1.01, 1.05],
    points: ["8:55 AM information design", "Search and pagination still exist"],
  },
  {
    id: "detail",
    kind: "capture",
    eyebrow: "Forensics",
    title: "Event history is the source of truth",
    caption:
      "The asset detail page shows current state first, then newest-first scan history.",
    image: "09-asset-detail.png",
    duration: seconds(17),
    focus: [0.52, 0.62],
    zoom: [1.015, 1.065],
    points: ["Receive", "Store", "Deploy", "Transfer custody"],
  },
  {
    id: "reconcile",
    kind: "capture",
    eyebrow: "Reconciliation",
    title: "Manager language, not raw diffs",
    caption:
      "Ops, facilities, and finance are joined server-side and translated into action categories.",
    image: "10-reconcile.png",
    duration: seconds(22),
    focus: [0.5, 0.45],
    zoom: [1.01, 1.05],
    points: ["Fix today", "Needs a human", "Probably fine", "Clean"],
  },
  {
    id: "tradeoff",
    kind: "text",
    eyebrow: "Call I nearly made the other way",
    title: "Skip the preview? I kept it.",
    caption:
      "The simpler flow would scan asset, scan destination, and let the API validate. I kept the preview because one extra GET is cheap; sending a person back to the wrong rack is not.",
    duration: seconds(30),
    points: ["Preview catches wrong-tag mistakes", "Mutation happens only after confirmation", "Better for the dock workflow"],
  },
  {
    id: "barcodes",
    kind: "capture",
    eyebrow: "Reviewer kit",
    title: "Scannable Code 128 examples",
    caption:
      "The barcode sheet covers happy path, drift, disposed assets, ghost assets, locations, and badges.",
    image: "11-barcodes.png",
    duration: seconds(16),
    focus: [0.5, 0.6],
    zoom: [1.015, 1.06],
    points: ["Actual scanner input", "Interesting review cases", "No hand-built data needed"],
  },
  {
    id: "subtraction",
    kind: "text",
    eyebrow: "Subtraction",
    title: "What I chose not to build",
    caption:
      "Offline mode, RMA screens, full auth, and bulk import were intentionally left out. The hot path, audit trail, writebacks, and reconciliation matter more for this prototype.",
    duration: seconds(20),
    points: ["Subtraction is part of product judgment", "README documents the tradeoffs"],
  },
  {
    id: "closing",
    kind: "text",
    eyebrow: "Submission",
    title: "One scan. Three systems. Actionable drift.",
    caption:
      "AssetOps is built to make techs keep scanning and managers act faster on evidence.",
    duration: seconds(16),
    points: ["Repo and README include validation evidence", "Ready for review"],
  },
];

export const LOOM_DURATION_IN_FRAMES = scenes.reduce(
  (total, scene) => total + scene.duration,
  0,
);

const colors = {
  bg: "#05080b",
  cyan: "#67e8f9",
  green: "#34d399",
  text: "#f8fafc",
  dim: "rgba(226, 232, 240, 0.76)",
  panel: "rgba(2, 6, 23, 0.92)",
  border: "rgba(103, 232, 249, 0.36)",
};

function useProgress(duration: number) {
  const frame = useCurrentFrame();
  return {
    frame,
    progress: interpolate(frame, [0, duration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
  };
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
        top: 42,
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

function SceneProgress({index}: {index: number}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 116,
        bottom: 64,
        display: "flex",
        gap: 8,
      }}
    >
      {scenes.map((scene, sceneIndex) => (
        <div
          key={scene.id}
          style={{
            width: sceneIndex === index ? 52 : 16,
            height: 6,
            borderRadius: 999,
            background:
              sceneIndex <= index
                ? `linear-gradient(90deg, ${colors.cyan}, ${colors.green})`
                : "rgba(148, 163, 184, 0.28)",
          }}
        />
      ))}
    </div>
  );
}

function BulletList({points = []}: {points?: string[]}) {
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 14}}>
      {points.map((point) => (
        <div
          key={point}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            color: colors.dim,
            fontSize: 27,
            lineHeight: 1.24,
          }}
        >
          <span
            style={{
              marginTop: 9,
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
  );
}

function TextScene({scene, index}: {scene: LoomScene; index: number}) {
  const {frame, progress} = useProgress(scene.duration);
  const opacity = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: "clamp"});
  const y = interpolate(progress, [0, 1], [28, 0]);

  return (
    <AbsoluteFill style={{color: colors.text}}>
      <Background />
      <BrandMark />
      <div
        style={{
          position: "absolute",
          left: 150,
          top: scene.kind === "title" ? 214 : 178,
          width: 1180,
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        <div
          style={{
            color: colors.cyan,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 23,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 800,
            marginBottom: 30,
          }}
        >
          {scene.eyebrow}
        </div>
        <div
          style={{
            color: colors.text,
            fontSize: scene.kind === "title" ? 128 : 82,
            lineHeight: 0.98,
            fontWeight: 900,
            maxWidth: 1180,
          }}
        >
          {scene.title}
        </div>
        <div
          style={{
            marginTop: 30,
            color: colors.dim,
            fontSize: 36,
            lineHeight: 1.34,
            maxWidth: 1140,
          }}
        >
          {scene.caption}
        </div>
        <div
          style={{
            marginTop: 42,
            padding: 26,
            border: `1px solid ${colors.border}`,
            borderRadius: 24,
            background: colors.panel,
            maxWidth: 850,
          }}
        >
          <BulletList points={scene.points} />
        </div>
      </div>
      <SceneProgress index={index} />
    </AbsoluteFill>
  );
}

function BrowserFrame({scene}: {scene: LoomScene}) {
  const {frame} = useProgress(scene.duration);
  const [startZoom, endZoom] = scene.zoom ?? [1, 1.04];
  const [focusX, focusY] = scene.focus ?? [0.5, 0.5];
  const scale = interpolate(frame, [0, scene.duration], [startZoom, endZoom], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
  const panX = interpolate(focusX, [0, 1], [56, -56], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panY = interpolate(focusY, [0, 1], [34, -42], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 136,
        width: 1260,
        height: 708,
        borderRadius: 28,
        overflow: "hidden",
        border: "1px solid rgba(148, 163, 184, 0.28)",
        background: "#020617",
        boxShadow:
          "0 42px 120px rgba(0, 0, 0, 0.52), 0 0 0 1px rgba(255,255,255,0.04) inset",
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
            width: 510,
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
          localhost:3000 / AssetOps
        </div>
      </div>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 664,
          overflow: "hidden",
          background: "#030712",
        }}
      >
        <Img
          src={staticFile(`captures/${scene.image}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            transformOrigin: `${focusX * 100}% ${focusY * 100}%`,
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

function CaptureScene({scene, index}: {scene: LoomScene; index: number}) {
  const {frame} = useProgress(scene.duration);
  const opacity = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: "clamp"});
  const x = interpolate(frame, [0, 18], [34, 0], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{color: colors.text}}>
      <Background />
      <BrandMark />
      <BrowserFrame scene={scene} />
      <div
        style={{
          position: "absolute",
          left: 1414,
          top: 190,
          width: 410,
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
              fontSize: scene.id === "microcopy" ? 31 : 38,
              lineHeight: 1.08,
              fontWeight: 850,
            }}
          >
            {scene.title}
          </div>
          <div
            style={{
              marginTop: 18,
              color: colors.dim,
              fontSize: 24,
              lineHeight: 1.36,
            }}
          >
            {scene.caption}
          </div>
          <div style={{marginTop: 24}}>
            <BulletList points={scene.points} />
          </div>
        </div>
      </div>
      <SceneProgress index={index} />
    </AbsoluteFill>
  );
}

function Scene({scene, index}: {scene: LoomScene; index: number}) {
  if (scene.kind === "capture") {
    return <CaptureScene scene={scene} index={index} />;
  }
  return <TextScene scene={scene} index={index} />;
}

export const AssetOpsLoom = () => {
  let start = 0;

  return (
    <AbsoluteFill style={{backgroundColor: colors.bg}}>
      <Audio src={staticFile("narration/loom-voiceover.wav")} volume={0.95} />
      {scenes.map((scene, index) => {
        const from = start;
        start += scene.duration;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.duration}>
            <Scene scene={scene} index={index} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
