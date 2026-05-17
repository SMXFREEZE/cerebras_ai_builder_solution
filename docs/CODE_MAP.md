# Code Map

This repo has three jobs:

1. `api/` owns the asset-tracking API contract.
2. `starter/` owns the submitted Next.js product.
3. `demo-video/` owns the automated walkthrough video pipeline.

The product is intentionally split so reviewers can inspect the real app,
the real API, and the demo automation independently.

## Runtime Topology

```text
Browser
  |
  | calls same-origin routes
  v
starter/app/api/*
  |
  | attaches API_TOKEN server-side
  v
Standalone API on Vercel
  |
  | stores shared demo state
  v
Supabase
```

Locally, the same frontend can talk to the Fastify API:

```text
starter -> http://localhost:8080/v1 -> api/src/*
```

## Main User Flow

This is the important path to understand first:

```text
Technician scans asset/location
  -> starter/components/TechWorkflows.tsx
  -> starter/app/api/workflows/[action]/route.ts
  -> starter/lib/workflows.ts
  -> upstream API scan endpoint
  -> optional facilities/finance writeback
  -> success panel shows exactly what changed
```

The browser never receives the upstream API token. The frontend only calls
same-origin Next.js route handlers.

## Where Things Live

| Area                      | Read first                                        | Why                                                               |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| Tech workflows            | `starter/components/TechWorkflows.tsx`            | Per-flow state machines for receive, store, deploy, transfer.     |
| Shared workflow UI        | `starter/components/workflows/TechWorkflowUi.tsx` | Shell, status panels, form controls, asset preview, scan helpers. |
| Scanner focus             | `starter/components/ScanInput.tsx`                | Autofocus and keyboard-scanner behavior.                          |
| Camera scanner            | `starter/components/CameraScanButton.tsx`         | Lazy-loaded ZXing camera path for QR, Code 128, Data Matrix, PDF417, Code 39, Code 93, and ITF. |
| Write orchestration       | `starter/lib/workflows.ts`                        | Deploy/store side effects across ops, facilities, and finance.    |
| Workflow API route        | `starter/app/api/workflows/[action]/route.ts`     | Server boundary that receives browser workflow requests.          |
| Reconciliation logic      | `starter/lib/reconcile.ts`                        | Joins ops, facilities, and finance into action-oriented findings. |
| Manager reconciliation UI | `starter/components/ReconcileView.tsx`            | Turns reconciliation findings into manager language.              |
| Local API routes          | `api/src/routes/scans.ts`                         | Local Fastify scan endpoints and validation branches.             |
| Local state machine       | `api/src/domain/state-machine.ts`                 | Allowed asset-state transitions.                                  |
| Audit events              | `api/src/domain/events.ts`                        | Shared event factory for route mutations.                         |
| Deployed API              | `api/api/[...path].js`                            | Vercel serverless API used by the public app.                     |
| Demo automation           | `demo-video/scripts/*` and `demo-video/src/*`     | Playwright capture and Remotion render pipeline.                  |

## Scan Workflow Rules

| Scan                    | Changes ops?                      | Changes facilities? | Changes finance?  |
| ----------------------- | --------------------------------- | ------------------- | ----------------- |
| Receive                 | Yes, creates or returns the asset | No                  | No                |
| Duplicate receive       | Logs duplicate event              | No                  | No                |
| Store from `received`   | Moves asset to storage            | No                  | No                |
| Store from `in_service` | Moves asset to storage            | Clears rack row     | No                |
| Deploy                  | Moves asset to `in_service`       | Writes rack row     | Capitalizes asset |
| Transfer                | Changes custodian only            | No                  | No                |

## Error Handling

The API returns a consistent envelope:

```json
{
  "error": {
    "code": "invalid_transition",
    "message": "Cannot deploy an asset in state 'disposed'",
    "details": {}
  }
}
```

Frontend route handlers use `starter/lib/route-errors.ts` to preserve that
shape when errors pass through Next.js.

## What Is Deliberately Static

The seed data is deterministic on purpose. Reviewers need known tags for
testing:

- `C0000101` is a seeded asset detail example.
- `C0009001` is used in the happy-path demo.
- `/dev/barcodes` prints known asset, location, and badge codes.

This is fixture data, not hardcoded business logic.

## Verification Commands

Use Node 22 for local verification because the API package declares
`"node": "22.x"` and uses a native SQLite dependency.

```bash
npx -y -p node@22 -p pnpm@11.1.1 pnpm -r test
npx -y -p node@22 -p pnpm@11.1.1 pnpm -r lint
npx -y -p node@22 -p pnpm@11.1.1 pnpm --filter @asset-tracking/starter typecheck
npx -y -p node@22 -p pnpm@11.1.1 pnpm -r build
```

Production health check:

```bash
curl https://starter-plum-nine.vercel.app/api/upstream/health
```

Expected response:

```json
{ "ok": true, "version": "1.0.0-supabase" }
```

Production frontend/API wiring:

```text
App: https://starter-plum-nine.vercel.app
API: https://api-theta-five-98.vercel.app/api/v1
Browser -> /api/upstream/* -> API_BASE_URL, with API_TOKEN attached server-side
```
