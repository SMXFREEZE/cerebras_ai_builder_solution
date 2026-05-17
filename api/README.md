# Asset tracking API

The backend contract for AssetOps. Local development uses the Fastify/SQLite
service under `src/`; the public submission deploys the Vercel serverless
entrypoint under `api/[...path].js` so the frontend talks to a separate API.

## Running

```bash
# From the monorepo root
pnpm install
pnpm --filter @asset-tracking/api dev
# API on http://localhost:8080
```

Or from this directory:

```bash
pnpm dev
```

First start creates `data/asset-tracking.db` and seeds ~1,000 assets plus the facilities/finance mocks. Subsequent starts reuse the file.

## Reset the database

```bash
curl -X POST http://localhost:8080/v1/reset
```

Or from the starter, `api.reset()`.

## Inspect the database

```bash
sqlite3 api/data/asset-tracking.db
sqlite> .tables
events  assets
sqlite> SELECT asset_tag, state, custodian FROM assets;
```

## Tests

```bash
pnpm --filter @asset-tracking/api test
```

Two suites:

- `test/state-machine.test.ts` — every allowed transition succeeds; every undefined transition is rejected.
- `test/scans.test.ts` — receive (new, duplicate, mismatched serial), store, deploy, missing asset, reset.

The scan routes share the transition table in `src/domain/state-machine.ts`
and the audit-event factory in `src/domain/events.ts`, keeping state movement
and event recording in the domain layer instead of duplicating it per route.

## Build for production

```bash
pnpm --filter @asset-tracking/api build
node dist/index.js
```

## Standalone deployed API

The submitted production app also includes a Vercel serverless API entrypoint at
`api/[...path].js`. It mirrors the same challenge contract as the Fastify
service, but stores shared demo state in Supabase so the deployed frontend can
talk to a separately deployed API instead of an embedded fallback.

Production requests should include:

```text
Authorization: Bearer <API_TOKEN>
```

`GET /api/health` stays public so the frontend and reviewers can confirm the
deployment is using the standalone API.

## Environment

| Variable            | Default             | Notes                                                |
| ------------------- | ------------------- | ---------------------------------------------------- |
| `PORT`              | `8080`              |                                                      |
| `HOST`              | `0.0.0.0`           |                                                      |
| `API_DATA_DIR`      | `./data`            | Where the SQLite file lives.                         |
| `API_DB_FILE`       | `asset-tracking.db` | SQLite filename.                                     |
| `LOG_LEVEL`         | `info`              | Standard pino levels.                                |
| `API_TOKEN`         | unset               | Optional bearer token for the standalone Vercel API. |
| `SUPABASE_URL`      | unset               | Supabase project URL for the standalone Vercel API.  |
| `SUPABASE_ANON_KEY` | unset               | Supabase anon key used by the standalone Vercel API. |
