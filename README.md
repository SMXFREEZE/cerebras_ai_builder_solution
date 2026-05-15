# Cerebras asset tracking challenge

Submission frontend for the manufacturing AI builder challenge. The backend in
`api/` is unchanged; the product work lives in `starter/`.

## What is built

- `/`: premium YC/SaaS-style product landing page with a dark animated hero, moving cloud/grid background, live scan simulation, floating asset cards, dashboard preview, sticky storytelling sections, Framer Motion reveals, and GSAP headline animation.
- `/tech/receive`, `/tech/store`, `/tech/deploy`, `/tech/transfer`: mobile-first scan flows with keyboard-scanner input, optional camera scanning through the browser `BarcodeDetector`, recovery states, and clear API error surfacing.
- `/manager`: paginated/filterable asset list with state, site, custodian, and free-text search.
- `/manager/assets/[tag]`: current asset detail plus newest-first event log.
- `/manager/reconcile`: manager-friendly three-way ops/facilities/finance report.
- `/api/reconcile`: server route that joins the three systems and returns structured, ranked reconciliation items.
- `/dev/barcodes`: printable Code128 barcode sheet for demo assets, locations, and receiving badges.

## Run locally

```bash
pnpm install
cp starter/.env.example starter/.env
pnpm dev
```

Open `http://localhost:3000`.

The default local values are:

```bash
API_BASE_URL=http://localhost:8080/v1
API_TOKEN=local-dev-token-1234567890
```

## Writeback decision

Deploy/store side effects live in `starter/app/api/workflows/[action]/route.ts`.
The browser calls these same-origin workflow routes, and those routes call the
upstream API with the server-only token.

- Deploy first commits the ops scan, then writes the rack location to facilities and capitalizes the equipment row in finance.
- Store checks the previous ops state before the transition. If an `in_service` asset is stored, the facilities rack assignment is cleared.
- Receive and transfer do not write to facilities or finance.

I kept this out of client components so the token never moves to the browser and
so partial side-effect failures can be reported in one place.

## Reference pass

I used the supplied references as product/design checks rather than source code:

- Shelf.nu pushed the scan experience toward explicit modes, duplicate feedback, and "what now?" recovery copy.
- The shadcn/TailAdmin dashboard references pushed the manager home toward an action-first summary before the table.
- The barcode scanner references pushed the camera flow to detect supported formats, stop streams on close, and keep the keyboard scanner as the reliable primary path.
- The animation references pushed the landing page toward a premium first impression, but the motion is still product-native: scan beam, floating asset cards, dashboard preview, parallax cloud/grid background, Framer Motion reveals, and GSAP headline text instead of portfolio spectacle.

## Three calls I nearly made the other way

1. I nearly used direct browser calls for scans because the starter proxy makes it easy. I moved mutations into workflow route handlers so deploy/store can be atomic from the UI perspective and keep finance/facilities writes server-side.
2. I nearly hid seeded reconciliation issues behind aggregate counts. I chose explicit ranked cards because a manager needs the next human action, not only a drift number.
3. I nearly made camera scanning mandatory. I kept keyboard-scanner input as the primary path and camera as an optional path because the desktop/tablet scanner is the true hot path and browser camera APIs vary.

## Pushback / confusing bits

- The brief says camera scanner support is expected, but the starter has no dependency and native browser barcode support is uneven. I treated camera as progressive enhancement and made the keyboard scanner path first-class.
- The location examples mix storage locations and rack/RU locations. I made scanned locations accept `Site/Room/Rack` for storage and `Site/Room/Row/Rack/RU` for deploy so missing-RU errors are visible.
- The API can commit the ops deploy before a downstream mock write fails. In a production system I would add an outbox/retry record rather than making the UI pretend the entire workflow is transactional.

## Loom notes

The microcopy choice I would call out: deploy success says both
`Facilities rack assignment written` and `Finance capitalization written`. That
wording is deliberately operational; the technician sees that the scan did more
than change the local asset state.

## Original challenge docs

- [`docs/CHALLENGE.md`](./docs/CHALLENGE.md)
- [`starter/docs/happy-path.md`](./starter/docs/happy-path.md)
- [`starter/docs/api-reference.md`](./starter/docs/api-reference.md)
