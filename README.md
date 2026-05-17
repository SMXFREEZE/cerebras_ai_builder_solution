# AssetOps

**A scanner-first asset control tower for Cerebras manufacturing.**

AssetOps keeps operations, facilities, and finance aligned from the same scan event. The product is built around two moments that decide whether an asset system works in the real world:

- **11:00 PM at the dock:** a technician has gloves on, a scanner in one hand, and a 40 lb instrument in the other. The next correct scan should be obvious.
- **8:55 AM before standup:** a manager has 60 seconds to understand what is drifting, who owns it, and which evidence supports the next action.

This is not a generic inventory CRUD dashboard. It is a prototype for manufacturing traceability: fast scan flows, explicit writebacks, forensic event history, and a reconciliation report that says what to do instead of dumping a raw diff.

## Start here

If you are reviewing the code, read these in order:

1. [`docs/CODE_MAP.md`](./docs/CODE_MAP.md) - architecture, request flow, and file map.
2. [`starter/components/TechWorkflows.tsx`](./starter/components/TechWorkflows.tsx) - technician scan state machines.
3. [`starter/lib/workflows.ts`](./starter/lib/workflows.ts) - server-side writeback rules.
4. [`starter/lib/reconcile.ts`](./starter/lib/reconcile.ts) - ops/facilities/finance reconciliation logic.
5. [`api/src/routes/scans.ts`](./api/src/routes/scans.ts) - local API scan validation and transitions.

## 60-second reviewer path

If you only have a minute, click these in order:

| Route                      | What to look for                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `/`                        | Premium first impression: dark SaaS landing, Vanta fog, 3D asset graph, live event preview.   |
| `/tech/receive`            | Scanner autofocus, camera fallback, idempotent duplicate receive, serial conflict recovery.   |
| `/tech/store`              | Two-step asset -> shelf workflow with asset preview before mutation.                          |
| `/tech/deploy`             | Missing-RU validation, then deploy with facilities and finance writebacks.                    |
| `/tech/transfer`           | Two-sided custody handoff: logged-in user is implicit, receiving badge is explicit.           |
| `/manager`                 | Standup brief first, metrics second, searchable/paginated asset table after that.             |
| `/manager/assets/C0000101` | Full forensic event log for a seeded asset, newest first.                                     |
| `/manager/reconcile`       | Three-way ops/facilities/finance report with manager-language categories.                     |
| `/dev/barcodes`            | Printable QR + Code 128 labels for happy path, drift, disposed, ghost, locations, and badges. |

## What is included

| Area              | Implementation                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Tech scan UX      | Four scanner-first workflows under `/tech`: receive, store, deploy, transfer.                                                            |
| Barcode support   | Keyboard scanner path is primary. Camera scanner uses `@zxing/browser` for QR, Code 128, Data Matrix, PDF417, Code 39, Code 93, and ITF. |
| Writebacks        | Deploy writes facilities + finance. Store from `in_service` clears facilities. Other scans do not write.                                 |
| Reconciliation    | Server-side route handler at `/api/reconcile` joins operations, facilities, and finance.                                                 |
| Manager dashboard | Standup brief, first actions, metrics, filters, pagination, asset detail, event log.                                                     |
| Token safety      | Browser never receives `API_TOKEN`; all upstream calls go through server-side Next routes.                                               |
| Testing surface   | `/dev/barcodes` ships QR + Code 128 examples for the interesting review scenarios.                                                       |
| Polish            | Vanta fog background, 3D hero scene, fast scanner flows, mobile-safe tech route.                                                         |

The API in `api/` is deployed separately from the Next.js app. The public frontend points at that API through server-side route handlers, so the submitted app is not relying on an embedded fallback.

## Run locally

```bash
pnpm install
cp starter/.env.example starter/.env.local
pnpm dev
```

Ports:

```text
API:  http://localhost:8080
App:  http://localhost:3000
```

Default local environment:

```text
API_BASE_URL=http://localhost:8080/v1
API_TOKEN=local-dev-token-1234567890
```

Production deployment:

```text
App: https://starter-plum-nine.vercel.app
API: https://api-theta-five-98.vercel.app/api/v1
Health: https://starter-plum-nine.vercel.app/api/upstream/health
Demo: https://starter-plum-nine.vercel.app/demo
```

The deployed app is wired with:

```text
API_BASE_URL=https://api-theta-five-98.vercel.app/api/v1
APP_BASE_URL=https://starter-plum-nine.vercel.app
```

`API_TOKEN` remains server-only. The browser calls same-origin routes, and the
Next.js server attaches the token before forwarding to the standalone API.

The expected production health response is:

```json
{ "ok": true, "version": "1.0.0-supabase" }
```

Reset before a demo or Loom:

```bash
curl -X POST http://localhost:3000/api/upstream/reset
```

## Automated MP4 demo

The repo includes a repeatable demo-video pipeline for the current app. It does not rebuild or redesign the product; it records the running app with Playwright, turns the captured flow into a polished Remotion composition, then runs an FFmpeg faststart pass for easier upload.

```bash
pnpm dev
```

In a second terminal:

```bash
pnpm demo:record
pnpm demo:render
pnpm demo:loom
```

If `pnpm` is not on PATH yet, use `corepack pnpm demo:record`, `corepack pnpm demo:render`, and `corepack pnpm demo:loom`.

Output:

```text
submission-assets/AssetOps_Cerebras_Remotion_Demo.mp4
submission-assets/AssetOps_Cerebras_Loom_Walkthrough.mp4
```

Useful overrides:

```bash
APP_BASE_URL=http://localhost:3000 pnpm demo:record
DEMO_ASSET_TAG=C0009001 pnpm demo:record
PLAYWRIGHT_CHROME_EXECUTABLE_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" pnpm demo:record
```

`demo:record` resets the demo namespace and captures the 60-90 second reviewer path as browser screenshots. `demo:render` composes those captures into a 1080p MP4 with title/context/closing scenes, animated zooms, and captions.

`demo:loom` records a fresh live browser walkthrough with Playwright, extracts zoom frames with FFmpeg, generates narration, then renders a 3-5 minute YC-style MP4 with smart zooms and callouts. It covers the official Loom points plus every major app surface: receive, duplicate receive, serial conflict recovery, store, deploy validation, deploy writebacks, transfer, store-from-in-service de-racking, manager filtering, asset detail, reconciliation, and barcode coverage.

## Validation I ran

```bash
pnpm lint
pnpm test
pnpm --filter @asset-tracking/starter typecheck
pnpm build
pnpm demo:record
pnpm demo:render
pnpm demo:loom
```

Last full local QA pass:

| Check                 | Result                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| API unit tests        | 27 / 27 passed                                                                                  |
| Starter tests         | 15 / 15 passed                                                                                  |
| Lint                  | Passed                                                                                          |
| Typecheck             | Passed                                                                                          |
| Production build      | Passed                                                                                          |
| Browser happy path    | Passed                                                                                          |
| Console/page errors   | No unexpected errors                                                                            |
| Runtime overlays      | None                                                                                            |
| Horizontal overflow   | None on desktop or mobile receive                                                               |
| Public API deployment | Separate Vercel API, Supabase-backed shared state                                               |
| Public API hardening  | Health public, mutation/list routes require bearer token, malformed JSON returns `invalid_json` |

Browser happy path covered:

1. Reset namespace.
2. Home renders Vanta fog plus 3D hero scene.
3. Barcode sheet renders printable scannable codes.
4. Receive fresh asset `C0009001`.
5. Duplicate receive logs `duplicate_receive` without failing.
6. Different serial on same tag shows a conflict with both serials.
7. Store `C0009001` to shelf.
8. Deploy with missing RU shows a local validation error.
9. Deploy with complete rack/RU writes facilities and finance.
10. Transfer custody to `tech-mike`; state remains `in_service`.
11. Manager list finds the asset.
12. Asset detail shows newest-first event history.
13. Reconciliation no longer flags the deployed asset as drift.
14. Mobile receive keeps the scanner input focused and camera button reachable.

Final verified asset state after the happy path:

```json
{
  "asset_tag": "C0009001",
  "state": "in_service",
  "location": {
    "site": "Lab-Building-A",
    "room": "Bay-12",
    "row": "Aisle-3",
    "rack": "B-04",
    "ru": "U21"
  },
  "custodian": "tech-mike"
}
```

Event log included:

```text
receive
duplicate_receive
store
deploy
transfer_custody
```

## Product philosophy

Asset systems fail when the product asks the wrong person to hold too much context.

For the technician, the app should answer:

- What do I scan next?
- Did the write happen?
- If it failed, was anything written?
- Can I recover without opening another page?

For the manager, the app should answer:

- What should I say in standup?
- Which assets need action today?
- Which differences are expected noise?
- What evidence trail supports the action?

Every major UI choice comes back to those questions.

## Tech scan workflows

The four `/tech` screens share the same design grammar:

- A large monospace scan input.
- Autofocus on entry, with a second focus pass after paint.
- Refocus on the next scanner keystroke if focus drifts away.
- Camera button next to the scanner field as a fallback.
- Step dots that say where the technician is in the flow.
- Green success panel when a write completed.
- Red error panel when nothing was written.

Store, deploy, and transfer are intentionally two-step:

```text
scan asset -> preview current asset -> scan destination/badge -> write
```

That middle preview is not decoration. It catches wrong-tag mistakes before the second scan mutates state.

## Manager dashboard

The manager page starts with a standup brief instead of a table.

The table is still there, with server-side filtering and pagination, but it is not the first thing on the screen. A manager opening the product cold needs the highest-priority exception, the owner, and the reason it matters. Search and filtering can wait until after that context exists.

The asset detail page treats the event log as the forensic source of truth. It renders the current state first, then the newest-first event stream with scan payloads and state/location changes visible.

## Reconciliation model

`/api/reconcile` pulls:

- Operations assets from the API.
- Facilities rack rows from the mock facilities system.
- Finance equipment rows from the mock ERP system.

It joins by tag, then classifies differences. The internal severity values remain:

```text
critical
review
watch
clean
```

The manager UI translates those into action labels:

```text
Fix today
Needs a human
Probably fine
Clean
```

That translation is deliberate. A non-technical asset manager should not need to know the taxonomy to understand the next action.

## Where writes live

Writes live in the server route handler:

```text
starter/app/api/workflows/[action]/route.ts
```

The browser calls:

```text
/api/workflows/receive
/api/workflows/store
/api/workflows/deploy
/api/workflows/transfer
```

The route handler then calls the upstream API with the server-only bearer token.

Why server-side?

1. **Token safety:** the bearer token never enters the browser bundle or DevTools network panel.
2. **One user action, multiple writes:** deploy is one user action that writes ops, facilities, and finance.
3. **Meaningful success copy:** the server returns side-effect lines based on what actually completed.
4. **Auditability:** partial-write behavior is centralized instead of being spread across client components.

Write rules implemented:

| Scan                    | Operations          | Facilities     | Finance    |
| ----------------------- | ------------------- | -------------- | ---------- |
| Receive                 | Create/return asset | No write       | No write   |
| Duplicate receive       | Log duplicate event | No write       | No write   |
| Store from `received`   | Move to stored      | No write       | No write   |
| Store from `in_service` | Move to stored      | Clear rack row | No write   |
| Deploy                  | Move to in service  | Write rack row | Capitalize |
| Transfer                | Change custodian    | No write       | No write   |

## Three calls I nearly made the other way.

### 1. Fetch current asset state between scan step 1 and scan step 2

The simpler version would skip the preview. Scan the asset, scan the shelf or badge, let the API validate, and show the response.

I added the preview anyway. The extra API round trip is cheap. The human round trip back to the dock or rack is not. If the technician scans the wrong tag, the preview shows the model, current state, custodian, and location before a write occurs. That is the cheapest moment to catch the mistake.

Trade-off: one extra GET per store/deploy/transfer flow.

Decision: worth it for a hot-path physical workflow.

### 2. Use manager-language reconciliation labels

The API can expose precise labels like `critical`, `review`, and `watch`. Those are good engineering labels.

They are weaker manager labels.

The manager does not need to decode severity. They need to know what to do. So the UI says:

```text
Fix today
Needs a human
Probably fine
```

Trade-off: UI vocabulary differs from the JSON vocabulary.

Decision: acceptable, because the API contract stays precise while the screen speaks to the person using it.

### 3. Treat camera scanning as fallback, not the main path

The brief says keyboard scanner and phone camera should both feel native. I agree, but they are not equally reliable.

A USB/Bluetooth scanner behaves like a keyboard. If the input is focused, the scan works.

Camera scanning depends on browser support, permission state, lighting, autofocus, label print quality, and device performance. It is valuable, but it should not be the only happy path.

Implementation detail: the camera path uses `@zxing/browser`, lazy-loaded only
when the technician opens the camera modal. The accepted decode formats are
curated for manufacturing labels: QR, Code 128, Data Matrix, PDF417, Code 39,
Code 93, and ITF. Retail/book formats such as EAN/UPC are intentionally not in
the default set; even if a decoder read them, workflow validation would still
reject non-AssetOps tags.

Trade-off: the visual emphasis is on the keyboard scanner field, with camera beside it.

Decision: correct for manufacturing. The most reliable path gets first-class treatment.

## Microcopy I would walk through in the Loom

After a successful deploy, the success panel says:

```text
Facilities rack assignment written.
Finance capitalization written.
```

It does not say "Success!" and stop there.

Those lines name the two downstream systems that moved because of the scan. They are generated by the server workflow response, not hard-coded as generic optimism in the client.

The important property is absence. If only one side effect completed in a future hardened version, the success panel would have one line instead of two. That missing line would be meaningful to a technician and to a manager reviewing drift later.

Good operational microcopy should be diffable. It should tell a tired person exactly what changed.

## Pushback on the brief and starter

### Camera scanning is not equivalent to keyboard scanning

Camera scanning is a useful fallback. Keyboard-emulated handheld scanners are the industrial default because they are boring and reliable. I would frame camera scanning as progressive enhancement in the brief.

### Location schemas deserve one extra sentence

Storage locations and deploy locations look similar, but deploy is stricter:

```text
store:  Site/Room/Shelf
deploy: Site/Room/Row/Rack/RU
```

The API enforces this, but the brief could make the difference more explicit.

### Deploy is not truly transactional

Deploy commits the ops state before facilities and finance writebacks. In production I would add an outbox, retry queue, compensating write, or transaction boundary owned by the upstream service. For this prototype I centralized the side effects in the Next route handler and surface the completed side effects in the response.

## What I chose not to build

| Not built                     | Why                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Offline scan queue            | Offline writes without conflict resolution can create worse drift. The prototype should fail loudly instead.             |
| RMA UI                        | The state machine supports it, but the brief says it is not required.                                                    |
| Full authentication           | Out of scope; the cookie role switcher is enough to demo tech and manager perspectives.                                  |
| Bulk import/export            | Not part of the core scan/reconcile challenge.                                                                           |
| Smooth scroll on tech screens | Native, predictable scroll is better for scanner-first tools. Motion belongs on the landing page, not the dock workflow. |
| Custom barcode library        | The starter Code 128 renderer works and keeps dependencies smaller.                                                      |

## Files worth reviewing

| Path                                              | Why it matters                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `starter/components/TechWorkflows.tsx`            | The four scanner workflow state machines: receive, store, deploy, transfer.                            |
| `starter/components/workflows/TechWorkflowUi.tsx` | Reusable scanner shell, status panels, form primitives, and workflow request helpers.                  |
| `starter/components/ScanInput.tsx`                | Autofocus and scanner refocus behavior. Small file, high product impact.                               |
| `starter/components/CameraScanButton.tsx`         | Real browser-camera scanner integration using ZXing with curated manufacturing barcode formats.        |
| `starter/app/api/workflows/[action]/route.ts`     | Server-side mutation orchestration and writeback rules.                                                |
| `starter/app/api/reconcile/route.ts`              | Three-system join and report construction.                                                             |
| `starter/lib/route-errors.ts`                     | Shared API-route error serialization so workflow and reconciliation failures return the same envelope. |
| `starter/components/ReconcileView.tsx`            | Manager-language reconciliation UI.                                                                    |
| `starter/app/manager/page.tsx`                    | Standup-first manager information design.                                                              |
| `starter/app/manager/assets/[tag]/page.tsx`       | Forensic asset detail and event history.                                                               |
| `starter/app/dev/barcodes/page.tsx`               | Scannable QR + Code 128 review/test matrix.                                                            |
| `starter/components/VantaFogBackground.tsx`       | Lightweight animated background wrapper for the premium first impression.                              |
| `starter/components/HeroScene.tsx`                | 3D wireframe hero scene.                                                                               |
| `api/src/domain/events.ts`                        | Centralized audit-event factory shared by scan route mutations.                                        |
| `api/api/[...path].js`                            | Standalone deployed Vercel API entrypoint backed by Supabase shared demo state.                        |

## Outside references used

I used outside references as product pressure, not as copy-paste decoration:

- The challenge brief: judgment, microcopy, trade-offs, subtraction, pushback.
- GS1-style traceability thinking: who, what, when, where, why.
- Shelf.nu and asset-management references: custody, location hierarchy, QR/barcode tags, audit trails.
- shadcn-style UI thinking: accessible primitives, clear composition, strong information hierarchy.
- Modern SaaS references: Linear, Vercel, Ramp, Raycast, and YC startup landing patterns.
- Vanta/Three.js references: motion as atmosphere on the landing page, not as friction in the tool.

## Submission notes

Public app:

```text
https://starter-plum-nine.vercel.app
```

Public repo:

```text
https://github.com/SMXFREEZE/cerebras_ai_builder_solution
```

Public API:

```text
https://api-theta-five-98.vercel.app/api/v1
```

Video walkthrough:

```text
https://starter-plum-nine.vercel.app/demo
```

Original challenge docs:

- [`docs/CHALLENGE.md`](./docs/CHALLENGE.md)
- [`starter/docs/api-reference.md`](./starter/docs/api-reference.md)
- [`starter/docs/happy-path.md`](./starter/docs/happy-path.md)
