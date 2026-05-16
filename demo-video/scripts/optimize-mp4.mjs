import fs from "node:fs/promises";
import path from "node:path";
import {execFileSync} from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const target = process.argv[2];

if (!target) {
  console.error("Usage: node scripts/optimize-mp4.mjs <video.mp4>");
  process.exit(1);
}

const absoluteTarget = path.resolve(process.cwd(), target);
const tempTarget = absoluteTarget.replace(/\.mp4$/i, ".faststart.tmp.mp4");

try {
  execFileSync(
    ffmpegPath,
    [
      "-y",
      "-i",
      absoluteTarget,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      tempTarget,
    ],
    {stdio: "pipe"},
  );
  await fs.rename(tempTarget, absoluteTarget);
  console.log(`Optimized MP4 for upload: ${absoluteTarget}`);
} catch (error) {
  await fs.rm(tempTarget, {force: true}).catch(() => {});
  console.warn(
    `FFmpeg faststart optimization skipped; Remotion output still exists at ${absoluteTarget}.`,
  );
  console.warn(error instanceof Error ? error.message : String(error));
}
