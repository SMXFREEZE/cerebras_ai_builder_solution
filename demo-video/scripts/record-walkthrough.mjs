import fs from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");
const outputDir = path.join(projectDir, "public", "walkthrough");
const tempVideoDir = path.join(outputDir, ".tmp");
const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

const demoTag = process.env.DEMO_ASSET_TAG ?? "C0009001";
const receiveSerial = process.env.DEMO_SERIAL ?? "SN-VIDEO-1";
const storageShelf = "Lab-Building-A/Storage-1/SHELF-3";
const deployMissingRu = "Lab-Building-A/Bay-12/Aisle-3/B-04";
const deployRack = "Lab-Building-A/Bay-12/Aisle-3/B-04/U21";

function getChromeExecutable() {
  const explicit = process.env.PLAYWRIGHT_CHROME_EXECUTABLE_PATH;
  if (explicit) return explicit;

  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

async function ensureAppIsRunning() {
  try {
    const response = await fetch(appBaseUrl);
    if (response.ok) return;
  } catch {
    // Fall through to the clear error below.
  }

  throw new Error(
    `The app is not reachable at ${appBaseUrl}. Start it first with "pnpm dev", then run "pnpm demo:loom".`,
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

async function launchBrowser() {
  const executablePath = getChromeExecutable();
  return chromium.launch({
    headless: true,
    ...(executablePath ? {executablePath} : {}),
  });
}

function stamp(startedAt) {
  return Number(((Date.now() - startedAt) / 1000).toFixed(2));
}

async function pause(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function smoothWheel(page, totalY, steps = 10, delayMs = 70) {
  const stepY = totalY / steps;
  for (let index = 0; index < steps; index += 1) {
    await page.mouse.wheel(0, stepY);
    await pause(delayMs);
  }
}

async function waitForText(page, text) {
  await page.getByText(text, {exact: false}).first().waitFor({timeout: 30_000});
}

async function goto(page, route) {
  await page.goto(`${appBaseUrl}${route}`, {waitUntil: "networkidle"});
  await hideDevChrome(page);
  await pause(900);
}

async function hideDevChrome(page) {
  await page
    .addStyleTag({
      content: `
        html {
          scroll-behavior: smooth !important;
        }

        nextjs-portal,
        [data-nextjs-toast],
        [data-nextjs-dialog-overlay],
        [data-nextjs-devtools-button] {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `,
    })
    .catch(() => undefined);
}

async function scan(page, value) {
  const input = page.locator("input.scan-input").first();
  await input.waitFor({state: "visible", timeout: 10_000});
  await input.click();
  await input.fill(value);
  await pause(220);
  await page.keyboard.press("Enter");
  await pause(950);
}

async function clickVisible(page, name) {
  await page.getByRole("link", {name}).first().click();
  await page.waitForLoadState("networkidle");
  await pause(750);
}

async function fillLabel(page, label, value) {
  const field = page.getByLabel(label).first();
  await field.waitFor({state: "visible", timeout: 10_000});
  await field.fill(value);
  await pause(300);
}

async function run() {
  await ensureAppIsRunning();
  await resetDemoData();
  await fs.rm(outputDir, {recursive: true, force: true});
  await fs.mkdir(tempVideoDir, {recursive: true});

  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: {width: 1600, height: 900},
    deviceScaleFactor: 1,
    recordVideo: {
      dir: tempVideoDir,
      size: {width: 1600, height: 900},
    },
  });
  await context.addCookies([
    {
      name: "asset-challenge-role",
      value: "tech",
      domain: "localhost",
      path: "/",
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ]);

  const page = await context.newPage();
  const video = page.video();
  const startedAt = Date.now();
  const markers = [];
  const mark = (label) => {
    const at = stamp(startedAt);
    markers.push({label, at});
    console.log(`${String(at).padStart(6, " ")}s  ${label}`);
  };

  try {
    mark("home: premium product surface");
    await goto(page, "/");
    await smoothWheel(page, 520, 10, 70);
    await pause(1600);
    await smoothWheel(page, -520, 10, 70);
    await pause(3000);

    mark("tech console: four required scan flows");
    await goto(page, "/tech");
    await waitForText(page, "Receive");
    await pause(3500);

    mark("receive: scan fresh asset");
    await clickVisible(page, /Receive/i);
    await fillLabel(page, /Serial/i, receiveSerial);
    await scan(page, demoTag);
    await waitForText(page, `${demoTag} receipt accepted.`);
    await pause(3600);

    mark("receive: duplicate is safe, serial conflict explains recovery");
    await scan(page, demoTag);
    await waitForText(page, `${demoTag} receipt accepted.`);
    await pause(1400);
    await fillLabel(page, /Serial/i, "SN-VIDEO-2");
    await scan(page, demoTag);
    await waitForText(page, "Expected serial");
    await waitForText(page, "Scanned serial");
    await pause(4400);

    mark("store: two-step asset preview then shelf commit");
    await goto(page, "/tech/store");
    await scan(page, demoTag);
    await waitForText(page, demoTag);
    await pause(1400);
    await scan(page, storageShelf);
    await waitForText(page, `${demoTag} stored.`);
    await pause(3600);

    mark("deploy: incomplete rack is blocked before writebacks");
    await goto(page, "/tech/deploy");
    await scan(page, demoTag);
    await waitForText(page, demoTag);
    await pause(1200);
    await scan(page, deployMissingRu);
    await waitForText(page, "Rack unit is missing.");
    await pause(4200);

    mark("deploy: complete rack writes ops, facilities, and finance");
    await scan(page, deployRack);
    await waitForText(page, `${demoTag} deployed.`);
    await waitForText(page, "Facilities rack assignment written.");
    await waitForText(page, "Finance capitalization written.");
    await pause(4400);

    mark("transfer: self-transfer rejection then valid custody handoff");
    await goto(page, "/tech/transfer");
    await scan(page, demoTag);
    await waitForText(page, demoTag);
    await pause(1200);
    await scan(page, "tech-jane");
    await waitForText(page, "transfer custody to yourself");
    await pause(2800);
    await scan(page, "tech-mike");
    await waitForText(page, `${demoTag} transferred to tech-mike.`);
    await pause(3800);

    mark("store: in-service de-rack clears facilities assignment");
    await goto(page, "/tech/store");
    await scan(page, "C0000101");
    await waitForText(page, "C0000101");
    await pause(1200);
    await scan(page, storageShelf);
    await waitForText(page, "C0000101 stored.");
    await waitForText(page, "Facilities rack assignment cleared.");
    await pause(3400);

    mark("manager: standup brief, filters, and live asset table");
    await goto(page, "/manager");
    await waitForText(page, "60-second standup brief");
    await pause(1800);
    await fillLabel(page, /Search/i, demoTag);
    await page.getByRole("button", {name: /Apply/i}).click();
    await page.waitForLoadState("networkidle");
    await waitForText(page, demoTag);
    await pause(3400);

    mark("asset detail: current state and full event log");
    await page.getByRole("link", {name: demoTag}).first().click();
    await page.waitForLoadState("networkidle");
    await waitForText(page, "Event log");
    await waitForText(page, "Transfer");
    await pause(4800);

    mark("reconciliation: categorized ops/facilities/finance drift");
    await goto(page, "/manager/reconcile");
    await waitForText(page, "Fix today");
    await waitForText(page, "Recommendation");
    await smoothWheel(page, 640, 12, 70);
    await pause(3600);

    mark("barcodes: scannable review kit");
    await goto(page, "/dev/barcodes");
    await waitForText(page, "Test barcode sheet");
    await waitForText(page, "Deploy missing RU");
    await smoothWheel(page, 620, 12, 70);
    await pause(3600);

    mark("closing: submission evidence");
    await goto(page, "/manager/assets/C0009001");
    await waitForText(page, "Event log");
    await pause(3800);
  } catch (error) {
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
    throw error;
  }

  if (!video) {
    throw new Error("Playwright did not create a video artifact.");
  }

  const videoPath = path.join(outputDir, "app-working.webm");
  await context.close();
  const rawVideoPath = await video.path();
  await browser.close();
  await fs.copyFile(rawVideoPath, videoPath);
  await fs.rm(tempVideoDir, {recursive: true, force: true});

  const manifest = {
    generatedAt: new Date().toISOString(),
    appBaseUrl,
    video: "app-working.webm",
    markers,
  };
  const manifestDir = path.join(projectDir, "out");
  await fs.mkdir(manifestDir, {recursive: true});
  await fs.writeFile(
    path.join(manifestDir, "walkthrough-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`Recorded full live walkthrough: ${videoPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
