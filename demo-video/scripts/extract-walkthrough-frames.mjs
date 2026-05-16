import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");
const walkthroughDir = path.join(projectDir, "public", "walkthrough");
const sourceVideo = path.join(walkthroughDir, "app-working.webm");
const outputDir = path.join(walkthroughDir, "frames");

const frames = [
  ["home-systems.jpg", 8],
  ["tech-console.jpg", 12],
  ["receive-fields.jpg", 20],
  ["receive-conflict.jpg", 31.5],
  ["store-preview.jpg", 41],
  ["deploy-blocked.jpg", 49],
  ["deploy-writebacks.jpg", 60.5],
  ["transfer-success.jpg", 75.5],
  ["derack-cleared.jpg", 84.5],
  ["manager-standup.jpg", 93],
  ["asset-event-log.jpg", 100.5],
  ["reconcile-categories.jpg", 112],
  ["barcode-kit.jpg", 120],
  ["final-proof.jpg", 126],
];

function timestamp(seconds) {
  const whole = Math.floor(seconds);
  const ms = Math.round((seconds - whole) * 1000);
  const hh = String(Math.floor(whole / 3600)).padStart(2, "0");
  const mm = String(Math.floor((whole % 3600) / 60)).padStart(2, "0");
  const ss = String(whole % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}.${String(ms).padStart(3, "0")}`;
}

async function run() {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not resolve an ffmpeg binary.");
  }

  await fs.access(sourceVideo);
  await fs.rm(outputDir, {recursive: true, force: true});
  await fs.mkdir(outputDir, {recursive: true});

  for (const [name, at] of frames) {
    const output = path.join(outputDir, name);
    await execFileAsync(ffmpegPath, [
      "-y",
      "-ss",
      timestamp(at),
      "-i",
      sourceVideo,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      output,
    ]);
    console.log(`Extracted ${name} at ${timestamp(at)}`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
