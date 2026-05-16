# AssetOps Demo Video

Automated demo pipeline for the existing AssetOps app.

```bash
pnpm dev
pnpm demo:record
pnpm demo:render
pnpm demo:loom
```

The MP4s are written to:

```text
../submission-assets/AssetOps_Cerebras_Remotion_Demo.mp4
../submission-assets/AssetOps_Cerebras_Loom_Walkthrough.mp4
```

`demo:record` uses Playwright to reset local demo data, click through the technician and manager flow, and capture screenshots. `demo:render` uses Remotion for the polished composition and FFmpeg for upload-friendly MP4 optimization.

`demo:loom` records a fresh live browser walkthrough with Playwright, extracts zoom frames with FFmpeg, generates a Windows System.Speech voiceover from `scripts/loom-voiceover.txt`, then renders a 3-5 minute YC-style challenge walkthrough with smart zooms and callouts. It shows the app working across receive, duplicate receive, serial conflict recovery, store, deploy validation, deploy writebacks, transfer, de-racking, manager filtering, asset detail, reconciliation, and barcode coverage.
