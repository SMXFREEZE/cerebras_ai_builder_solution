# AssetOps Demo Video

Automated demo pipeline for the existing AssetOps app.

```bash
pnpm dev
pnpm demo:record
pnpm demo:render
```

The final MP4 is written to:

```text
../submission-assets/AssetOps_Cerebras_Remotion_Demo.mp4
```

`demo:record` uses Playwright to reset local demo data, click through the technician and manager flow, and capture screenshots. `demo:render` uses Remotion for the polished composition and FFmpeg for upload-friendly MP4 optimization.
