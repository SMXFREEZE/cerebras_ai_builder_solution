import {Composition} from "remotion";
import {AssetOpsLoom, LOOM_DURATION_IN_FRAMES, LOOM_FPS, LOOM_HEIGHT, LOOM_WIDTH} from "./loom";
import {AssetOpsDemo, DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH} from "./video";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AssetOpsDemo"
        component={AssetOpsDemo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="AssetOpsLoom"
        component={AssetOpsLoom}
        durationInFrames={LOOM_DURATION_IN_FRAMES}
        fps={LOOM_FPS}
        width={LOOM_WIDTH}
        height={LOOM_HEIGHT}
      />
    </>
  );
};
