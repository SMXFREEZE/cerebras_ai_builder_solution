import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import {DemoScene, CaptureScene, TextScene, scenes} from "./scenes";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_IN_FRAMES = scenes.reduce(
  (sum, scene) => sum + scene.duration,
  0,
);

const colors = {
  bg: "#05080b",
  panel: "rgba(8, 19, 28, 0.86)",
  border: "rgba(125, 211, 252, 0.32)",
  cyan: "#67e8f9",
  green: "#34d399",
  text: "#f8fafc",
  dim: "rgba(226, 232, 240, 0.76)",
};

const springEase = Easing.bezier(0.16, 1, 0.3, 1);

function useSceneProgress(duration: number) {
  const frame = useCurrentFrame();
  return {
    frame,
    progress: interpolate(frame, [0, duration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: springEase,
    }),
  };
}

function Background() {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 15% 18%, rgba(34, 211, 238, 0.20), transparent 34%), radial-gradient(circle at 86% 76%, rgba(52, 211, 153, 0.14), transparent 31%), linear-gradient(135deg, #05080b 0%, #061723 55%, #05080b 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(circle at 50% 50%, black, transparent 76%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(5, 8, 11, 0.22) 100%)",
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

function TextSceneView({scene}: {scene: TextScene}) {
  const {frame, progress} = useSceneProgress(scene.duration);
  const titleY = interpolate(progress, [0, 1], [32, 0]);
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineScale = interpolate(progress, [0, 1], [0.2, 1]);

  return (
    <AbsoluteFill style={{color: colors.text}}>
      <Background />
      <BrandMark />
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 245,
          width: 1180,
          opacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 24,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: colors.cyan,
            fontWeight: 800,
            marginBottom: 34,
          }}
        >
          {scene.eyebrow}
        </div>
        <div
          style={{
            fontSize: scene.type === "title" ? 132 : 86,
            lineHeight: 0.96,
            fontWeight: 900,
            letterSpacing: "-0.045em",
            maxWidth: 1100,
          }}
        >
          {scene.title}
        </div>
        <div
          style={{
            marginTop: 34,
            color: colors.dim,
            fontSize: 38,
            lineHeight: 1.34,
            maxWidth: 1120,
          }}
        >
          {scene.caption}
        </div>
        <div
          style={{
            marginTop: 58,
            width: 430,
            height: 6,
            borderRadius: 999,
            transform: `scaleX(${lineScale})`,
            transformOrigin: "left center",
            background: `linear-gradient(90deg, ${colors.cyan}, ${colors.green}, #f8fafc)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

function BrowserFrame({scene}: {scene: CaptureScene}) {
  const {frame} = useSceneProgress(scene.duration);
  const scale = interpolate(frame, [0, scene.duration], scene.zoom, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
  const panX = interpolate(
    scene.focus[0],
    [0, 1],
    [70, -70],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  const panY = interpolate(
    scene.focus[1],
    [0, 1],
    [38, -44],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 116,
        top: 134,
        width: 1280,
        height: 720,
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
          height: 676,
          overflow: "hidden",
          background: "#030712",
        }}
      >
        <Img
          src={staticFile(`captures/${scene.file}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            transformOrigin: `${scene.focus[0] * 100}% ${scene.focus[1] * 100}%`,
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

function CaptionPanel({scene}: {scene: CaptureScene}) {
  const {frame} = useSceneProgress(scene.duration);
  const opacity = interpolate(frame, [5, 22], [0, 1], {
    extrapolateRight: "clamp",
  });
  const x = interpolate(frame, [5, 22], [36, 0], {
    extrapolateRight: "clamp",
    easing: springEase,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 1430,
        top: 232,
        width: 390,
        opacity,
        transform: `translateX(${x}px)`,
        zIndex: 30,
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
        Walkthrough
      </div>
      <div
        style={{
          padding: 28,
          borderRadius: 24,
          border: "1px solid rgba(103, 232, 249, 0.46)",
          background: "rgba(2, 6, 23, 0.94)",
          boxShadow:
            "0 32px 100px rgba(0,0,0,0.46), 0 0 80px rgba(103,232,249,0.13)",
        }}
      >
        <div
          style={{
            color: colors.text,
            fontSize: 38,
            lineHeight: 1.08,
            fontWeight: 850,
            letterSpacing: "-0.02em",
          }}
        >
          {scene.title}
        </div>
        <div
          style={{
            marginTop: 18,
            color: colors.dim,
            fontSize: 25,
            lineHeight: 1.4,
          }}
        >
          {scene.caption}
        </div>
      </div>
    </div>
  );
}

function Progress({sceneIndex}: {sceneIndex: number}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 116,
        bottom: 78,
        display: "flex",
        gap: 9,
      }}
    >
      {scenes.map((scene, index) => (
        <div
          key={scene.id}
          style={{
            width: index === sceneIndex ? 54 : 18,
            height: 6,
            borderRadius: 999,
            background:
              index <= sceneIndex
                ? `linear-gradient(90deg, ${colors.cyan}, ${colors.green})`
                : "rgba(148, 163, 184, 0.30)",
          }}
        />
      ))}
    </div>
  );
}

function CaptureSceneView({scene, sceneIndex}: {scene: CaptureScene; sceneIndex: number}) {
  return (
    <AbsoluteFill style={{color: colors.text}}>
      <Background />
      <BrandMark />
      <BrowserFrame scene={scene} />
      <CaptionPanel scene={scene} />
      <Progress sceneIndex={sceneIndex} />
    </AbsoluteFill>
  );
}

function SceneSwitch({scene, sceneIndex}: {scene: DemoScene; sceneIndex: number}) {
  if (scene.type === "capture") {
    return <CaptureSceneView scene={scene} sceneIndex={sceneIndex} />;
  }
  return <TextSceneView scene={scene} />;
}

export const AssetOpsDemo = () => {
  let start = 0;

  return (
    <AbsoluteFill style={{backgroundColor: colors.bg}}>
      {scenes.map((scene, index) => {
        const from = start;
        start += scene.duration;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.duration}>
            <SceneSwitch scene={scene} sceneIndex={index} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
