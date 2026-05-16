import {Composition} from "remotion";
import {AssetOpsDemo, DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH} from "./video";

export const RemotionRoot = () => {
  return (
    <Composition
      id="AssetOpsDemo"
      component={AssetOpsDemo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
