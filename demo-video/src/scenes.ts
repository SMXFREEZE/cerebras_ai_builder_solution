export type CaptureScene = {
  type: "capture";
  id: string;
  file: string;
  title: string;
  caption: string;
  duration: number;
  cursor: [[number, number], [number, number]];
  focus: [number, number];
  zoom: [number, number];
};

export type TextScene = {
  type: "title" | "context" | "closing";
  id: string;
  title: string;
  eyebrow: string;
  caption: string;
  duration: number;
};

export type DemoScene = CaptureScene | TextScene;

export const scenes: DemoScene[] = [
  {
    type: "title",
    id: "title",
    eyebrow: "Cerebras AI Builder Challenge",
    title: "AssetOps",
    caption:
      "A scanner-first asset control tower for manufacturing teams that need operations, facilities, and finance to agree.",
    duration: 120,
  },
  {
    type: "context",
    id: "context",
    eyebrow: "Problem",
    title: "Every missed scan becomes drift.",
    caption:
      "The demo follows a technician receiving, storing, deploying, and transferring one asset, then shows how managers reconcile the resulting records.",
    duration: 165,
  },
  {
    type: "capture",
    id: "home",
    file: "01-home.png",
    title: "Premium first impression",
    caption:
      "Vanta fog, a 3D asset graph, and a live event preview establish the product before the workflow starts.",
    duration: 165,
    cursor: [
      [0.2, 0.66],
      [0.36, 0.66],
    ],
    focus: [0.48, 0.48],
    zoom: [1.015, 1.055],
  },
  {
    type: "capture",
    id: "receiveReady",
    file: "02-receive-ready.png",
    title: "Scanner-first receive",
    caption:
      "The dock flow opens with the scan input focused and camera scanning available as a fallback.",
    duration: 150,
    cursor: [
      [0.36, 0.73],
      [0.66, 0.73],
    ],
    focus: [0.55, 0.64],
    zoom: [1.02, 1.08],
  },
  {
    type: "capture",
    id: "receiveSuccess",
    file: "03-receive-success.png",
    title: "Fresh asset accepted",
    caption:
      "A successful scan gives the technician a clear receipt and shows the committed state immediately.",
    duration: 150,
    cursor: [
      [0.62, 0.74],
      [0.36, 0.84],
    ],
    focus: [0.52, 0.78],
    zoom: [1.025, 1.09],
  },
  {
    type: "capture",
    id: "serialConflict",
    file: "04-serial-conflict.png",
    title: "Confusing scan recovery",
    caption:
      "A mismatched serial shows both values, so recovery is comparing labels instead of guessing at a generic error.",
    duration: 165,
    cursor: [
      [0.35, 0.76],
      [0.48, 0.84],
    ],
    focus: [0.45, 0.82],
    zoom: [1.02, 1.085],
  },
  {
    type: "capture",
    id: "deployMissingRu",
    file: "05-deploy-missing-ru.png",
    title: "Deploy validation",
    caption:
      "A deploy location missing RU is blocked before any facilities or finance writeback runs.",
    duration: 150,
    cursor: [
      [0.42, 0.73],
      [0.47, 0.82],
    ],
    focus: [0.5, 0.78],
    zoom: [1.025, 1.09],
  },
  {
    type: "capture",
    id: "deploySuccess",
    file: "06-deploy-success.png",
    title: "One scan, three systems",
    caption:
      "Deploy writes operations, facilities, and finance from the server, so the browser never receives the API token.",
    duration: 165,
    cursor: [
      [0.62, 0.76],
      [0.38, 0.86],
    ],
    focus: [0.51, 0.84],
    zoom: [1.02, 1.08],
  },
  {
    type: "capture",
    id: "transferSuccess",
    file: "07-transfer-success.png",
    title: "Custody handoff",
    caption:
      "The logged-in technician is implicit; the receiving badge is explicit; the asset remains in service.",
    duration: 135,
    cursor: [
      [0.38, 0.74],
      [0.52, 0.84],
    ],
    focus: [0.5, 0.78],
    zoom: [1.02, 1.08],
  },
  {
    type: "capture",
    id: "manager",
    file: "08-manager.png",
    title: "Manager standup view",
    caption:
      "The manager sees the first exception and action metrics before filtering through the table.",
    duration: 150,
    cursor: [
      [0.84, 0.2],
      [0.77, 0.58],
    ],
    focus: [0.5, 0.45],
    zoom: [1.01, 1.055],
  },
  {
    type: "capture",
    id: "assetDetail",
    file: "09-asset-detail.png",
    title: "Forensic event history",
    caption:
      "The asset detail page keeps the event log newest-first for audit and investigation.",
    duration: 135,
    cursor: [
      [0.76, 0.62],
      [0.53, 0.77],
    ],
    focus: [0.52, 0.62],
    zoom: [1.015, 1.07],
  },
  {
    type: "capture",
    id: "reconcile",
    file: "10-reconcile.png",
    title: "Three-way reconciliation",
    caption:
      "Ops, facilities, and finance are joined server-side and translated into manager-language categories.",
    duration: 165,
    cursor: [
      [0.76, 0.25],
      [0.2, 0.62],
    ],
    focus: [0.5, 0.45],
    zoom: [1.01, 1.055],
  },
  {
    type: "capture",
    id: "barcodes",
    file: "11-barcodes.png",
    title: "Scannable review kit",
    caption:
      "The barcode sheet covers happy path, drift, disposed, ghost, location, and badge scenarios.",
    duration: 135,
    cursor: [
      [0.25, 0.62],
      [0.75, 0.62],
    ],
    focus: [0.5, 0.6],
    zoom: [1.015, 1.065],
  },
  {
    type: "closing",
    id: "closing",
    eyebrow: "Submission",
    title: "Built for judgment, not feature count.",
    caption:
      "README covers tradeoffs, microcopy, pushback, what was intentionally not built, and validation evidence.",
    duration: 135,
  },
];
