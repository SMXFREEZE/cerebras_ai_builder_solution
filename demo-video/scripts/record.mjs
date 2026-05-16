import fs from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");
const captureDir = path.join(projectDir, "public", "captures");
const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
const tag = process.env.DEMO_ASSET_TAG ?? "C0009001";

const scenes = [
  {
    id: "home",
    file: "01-home.png",
    route: "/",
    title: "AssetOps control tower",
    caption:
      "Premium first impression: Vanta fog, 3D asset graph, and a live event preview for Cerebras manufacturing.",
    cursor: [
      [0.22, 0.67],
      [0.37, 0.67],
    ],
    focus: [0.48, 0.5],
  },
  {
    id: "receiveReady",
    file: "02-receive-ready.png",
    route: "/tech/receive",
    title: "Scanner-first receive",
    caption:
      "The dock workflow opens with the scan input focused and a camera fallback beside it.",
    cursor: [
      [0.31, 0.73],
      [0.66, 0.73],
    ],
    focus: [0.54, 0.64],
  },
  {
    id: "receiveSuccess",
    file: "03-receive-success.png",
    title: "Receipt accepted",
    caption:
      "A fresh asset tag creates the asset and gives the technician a clear green receipt.",
    cursor: [
      [0.64, 0.74],
      [0.38, 0.82],
    ],
    focus: [0.52, 0.78],
  },
  {
    id: "serialConflict",
    file: "04-serial-conflict.png",
    title: "Confusing scan recovery",
    caption:
      "A serial mismatch shows both serials so the technician can compare the physical label to the system record.",
    cursor: [
      [0.34, 0.78],
      [0.48, 0.83],
    ],
    focus: [0.45, 0.82],
  },
  {
    id: "deployMissingRu",
    file: "05-deploy-missing-ru.png",
    route: "/tech/deploy",
    title: "Deploy validation",
    caption:
      "Deploy requires site, room, rack, and RU. Missing RU is blocked before writebacks run.",
    cursor: [
      [0.42, 0.73],
      [0.46, 0.82],
    ],
    focus: [0.5, 0.78],
  },
  {
    id: "deploySuccess",
    file: "06-deploy-success.png",
    title: "One scan, three systems",
    caption:
      "Deploy writes operations, facilities, and finance from a server route so the browser never sees the token.",
    cursor: [
      [0.62, 0.76],
      [0.38, 0.86],
    ],
    focus: [0.51, 0.84],
  },
  {
    id: "transferSuccess",
    file: "07-transfer-success.png",
    route: "/tech/transfer",
    title: "Custody transfer",
    caption:
      "The logged-in technician is implicit. The receiving badge is explicit, and state stays in service.",
    cursor: [
      [0.38, 0.74],
      [0.52, 0.84],
    ],
    focus: [0.5, 0.78],
  },
  {
    id: "manager",
    file: "08-manager.png",
    route: `/manager?state=in_service&q=${tag}`,
    title: "Manager standup brief",
    caption:
      "The manager view starts with what needs action before exposing filters and tables.",
    cursor: [
      [0.84, 0.2],
      [0.76, 0.58],
    ],
    focus: [0.5, 0.45],
  },
  {
    id: "assetDetail",
    file: "09-asset-detail.png",
    route: `/manager/assets/${tag}`,
    title: "Forensic asset detail",
    caption:
      "The event log is newest first and shows receive, duplicate receive, store, deploy, and transfer.",
    cursor: [
      [0.76, 0.62],
      [0.53, 0.77],
    ],
    focus: [0.52, 0.62],
  },
  {
    id: "reconcile",
    file: "10-reconcile.png",
    route: "/manager/reconcile",
    title: "Three-way reconciliation",
    caption:
      "Ops, facilities, and finance are joined server-side, then translated into manager-language categories.",
    cursor: [
      [0.76, 0.25],
      [0.2, 0.62],
    ],
    focus: [0.5, 0.45],
  },
  {
    id: "barcodes",
    file: "11-barcodes.png",
    route: "/dev/barcodes",
    title: "Reviewer test surface",
    caption:
      "Scannable Code 128 cards cover happy path, drift, disposed assets, ghost assets, locations, and badges.",
    cursor: [
      [0.26, 0.62],
      [0.74, 0.62],
    ],
    focus: [0.5, 0.6],
  },
];

async function ensureAppIsRunning() {
  try {
    const response = await fetch(appBaseUrl);
    if (response.ok) return;
  } catch {
    // Fall through to the clear error below.
  }

  throw new Error(
    `The app is not reachable at ${appBaseUrl}. Start it first with "pnpm dev", then run "pnpm demo:record".`,
  );
}

async function resetDemoData() {
  const response = await fetch(`${appBaseUrl}/api/upstream/reset`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Reset failed with HTTP ${response.status}`);
  }
}

function getChromeExecutable() {
  const explicit = process.env.PLAYWRIGHT_CHROME_EXECUTABLE_PATH;
  if (explicit) return explicit;

  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

async function launchBrowser() {
  const executablePath = getChromeExecutable();
  return chromium.launch({
    headless: true,
    executablePath,
    channel: executablePath ? undefined : "chrome",
  });
}

async function screenshot(page, scene) {
  await page.screenshot({
    path: path.join(captureDir, scene.file),
    fullPage: false,
  });
}

async function goto(page, scene) {
  await page.goto(`${appBaseUrl}${scene.route}`, {waitUntil: "networkidle"});
  await page.waitForTimeout(650);
  await screenshot(page, scene);
}

async function scan(page, value) {
  await page.locator("input.scan-input").first().fill(value);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(850);
}

async function run() {
  await ensureAppIsRunning();
  await resetDemoData();
  await fs.rm(captureDir, {recursive: true, force: true});
  await fs.mkdir(captureDir, {recursive: true});

  const browser = await launchBrowser();
  const page = await browser.newPage({
    viewport: {width: 1600, height: 900},
    deviceScaleFactor: 1,
  });

  await goto(page, scenes[0]);
  await goto(page, scenes[1]);

  await page.getByLabel(/serial/i).fill("SN-VIDEO-1");
  await scan(page, tag);
  await screenshot(page, scenes[2]);

  await page.getByLabel(/serial/i).fill("SN-VIDEO-2");
  await scan(page, tag);
  await screenshot(page, scenes[3]);

  await page.goto(`${appBaseUrl}/tech/store`, {waitUntil: "networkidle"});
  await scan(page, tag);
  await scan(page, "Lab-Building-A/Storage-1/SHELF-3");
  await page.waitForTimeout(500);

  await page.goto(`${appBaseUrl}/tech/deploy`, {waitUntil: "networkidle"});
  await scan(page, tag);
  await scan(page, "Lab-Building-A/Bay-12/Aisle-3/B-04");
  await screenshot(page, scenes[4]);

  await scan(page, "Lab-Building-A/Bay-12/Aisle-3/B-04/U21");
  await screenshot(page, scenes[5]);

  await page.goto(`${appBaseUrl}/tech/transfer`, {waitUntil: "networkidle"});
  await scan(page, tag);
  await scan(page, "tech-mike");
  await screenshot(page, scenes[6]);

  await goto(page, scenes[7]);
  await goto(page, scenes[8]);
  await goto(page, scenes[9]);
  await goto(page, scenes[10]);

  await browser.close();

  const manifest = {
    generatedAt: new Date().toISOString(),
    appBaseUrl,
    scenes,
  };
  await fs.writeFile(
    path.join(captureDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`Captured ${scenes.length} demo screenshots in ${captureDir}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
