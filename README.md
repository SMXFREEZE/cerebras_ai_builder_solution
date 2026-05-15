# Cerebras asset tracking submission

This is my submission for the manufacturing AI builder challenge. The hosted API in `api/` is unchanged. Everything I built lives in `starter/`.

## Running it locally

```bash
pnpm install
cp starter/.env.example starter/.env.local
pnpm dev
```

The API comes up on port 8080, the app on port 3000. The default dev token in `.env.example` is fine for local work:

```
API_BASE_URL=http://localhost:8080/v1
API_TOKEN=local-dev-token-1234567890
```

I want to be explicit about how the token is handled, because the brief asked for an explanation of where mutations live. `API_TOKEN` is server-only. There is no `NEXT_PUBLIC_` version of it anywhere in the code. The browser never touches the upstream API directly. Instead, browser requests go through two same-origin proxies inside the Next app: `/api/upstream/*` for the read-only GETs, and `/api/workflows/[action]` for the four scan mutations. Both run on the server, both attach the token from `process.env.API_TOKEN`, and neither one accepts a token from the client. So if you open DevTools and watch network traffic, you will never see the bearer token. That was a deliberate choice and the rest of this README explains some of the reasoning behind it.

## What I built

### Tech: the four scan workflows

These are the screens at `/tech/receive`, `/tech/store`, `/tech/deploy`, `/tech/transfer`. The brief asks you to imagine a tech at 11pm in a cold dock bay, gloves on, scanner in one hand, holding a 40lb instrument with the other. I built for that person specifically.

Concretely, here is what that meant for the UI:

1. The scan input is a single 20px monospace field that autofocuses on page load. It also refocuses on any keystroke if focus drifts away. So if the tech taps somewhere by accident, or a modal closes, or anything else steals focus, the very next keystroke from the handheld scanner still goes into the right place. Focus loss in a scanner-first UI is a silent failure mode, and silent failures in a hot path are the worst kind.

2. Store, deploy, and transfer are all two-step flows: scan the asset, then scan the destination (a shelf, a rack, or a receiving badge). Between those two steps, the page does a `GET /v1/assets/:tag` and renders the current state of whatever was scanned. The tech sees the asset they are about to mutate before they commit it. If they scanned the wrong tag, the wrong manufacturer or model or current location will show up and they will catch it before the second scan triggers the write.

3. Success and error responses are visually distinct in a way you can read at a glance. Success has a green border, a check icon, and a one-line summary plus a list of any downstream writes that happened. Errors have a red border, a single-line message, the error code in monospace next to it, and a microcopy line that says "Nothing was written." I want a tired human to be able to look at the screen and immediately know whether the API moved or not. The error code is there for me when I am debugging, not for the tech.

The keyboard scanner is the primary path. Camera scanning is available as a fallback via the `<CameraScanButton>` component, but I did not build the page around it. More on that in the trade-offs section.

### Manager: the control tower

`/manager` is action-first. The first thing a manager sees when the page loads is four metric tiles: filtered, critical, review, clean. Critical, review, and clean are color-tinted (red, amber, green) so the eye lands on the wrong-looking number first. Below the tiles is a "first actions" panel that shows the top three reconciliation items, because a manager opening this page at 8:55am before standup needs to know what to act on before they need to know what is fine.

The filter form is below the action surface. The asset table is below that. Pagination is server-side via query params, so the URL is shareable and the back button works.

`/manager/assets/[tag]` is the asset detail page. The brief calls the event log "the manager's main forensic tool," so I made sure it renders newest-first with the full payload visible.

### Reconciliation

`/api/reconcile` is a server-side route handler that pulls ops, facilities, and finance, joins them by asset tag, and classifies each row. Three buckets, three labels. The original labels in the API are `critical`, `review`, and `watch`. I kept those internally but renamed them in the UI to **Fix today**, **Needs a human**, and **Probably fine**.

That rename is one of the three calls I want to talk about below. The short version: the brief says the audience for this page is a non-technical asset manager who runs the report every Monday. "Critical" makes a manager guess what they are supposed to do about it. "Fix today" tells them.

The route returns a structured report so the page is a thin renderer. The join logic and the classification rules live on the server because the bearer token cannot be in the browser bundle, and because if someone wants to add tests for the reconciliation logic later, the route is the place to do it.

### The barcode sheet

`/dev/barcodes` is the testing surface. The brief asks for "barcodes we can actually scan" covering interesting cases. I went past the bare minimum and made each barcode card explain what the code is for, so reviewers can see the testing matrix in one glance:

- A fresh asset tag (happy path receive)
- Two seeded assets with known drift (one rack mismatch flagged critical, one RMA case flagged review)
- A disposed asset (every scan rejects with `invalid_transition`)
- A ghost asset that exists in the finance mock but not in ops (receive returns 404)
- A complete deploy location (site, room, row, rack, RU)
- A deploy location missing the RU (triggers `incomplete_deploy_location`)
- Three badges for the transfer flow

The page chrome is dark, but each individual barcode card stays on a white background. That was deliberate. Code 128 needs the contrast to scan reliably. There is also a print button at the top.

### Landing

The route at `/` is a marketing landing page with a dark hero, a 3D wireframe in the right column, a live event log preview, and a few sections describing the product. It is not the product. It is the first thing a reviewer sees, so it needs to set tone, but I tried not to confuse polish for substance. The actual product is everything past the header.

## Three calls I nearly made the other way

### 1. Fetching the asset between step 1 and step 2 of store, deploy, and transfer

The alternative was to skip the GET. The asset would still be validated by the API on the second scan, and if it was the wrong tag or in the wrong state, the API would reject the write with a clear error. That is a perfectly defensible design.

I added the GET anyway, and here is why. The round-trip to the API is something like 30 milliseconds on a local network. The round-trip for the human, meaning the tech walking back to the rack to recheck what they scanned, is several minutes. Showing the asset's current state right after the first scan catches wrong-tag mistakes at the point in time where the fix is still cheap. The tech sees "you scanned C0000108, which is currently rma_pending in BAY-12, custodian tech-mike" and they have a chance to go "wait, that is not what I meant to scan" before the destination scan triggers the write.

The trade-off I am absorbing is one extra round-trip per workflow. I decided that was worth it for the hot path. If I were building this for a network where the API call cost real money or real latency, I would reconsider.

### 2. Renaming the severity buckets on the reconcile page

The reconcile API returns severity as one of `critical`, `review`, or `watch`. I kept those names internally everywhere they appear in the data layer. But in the manager UI I renamed them to **Fix today**, **Needs a human**, and **Probably fine**.

The alternative was to keep the engineering labels. They are more precise. "Critical" has a specific meaning, and a person familiar with the system can tell you exactly what makes something critical versus review.

But the brief is explicit about who reads this report. It says the audience is a non-technical asset manager who runs the report every Monday. That person does not need to know what makes something critical. They need to know whether to act on it. Engineering labels make them guess at the verb. "Fix today" is the verb.

The trade-off is that the labels in the UI now differ from the labels in the JSON. Anyone reading the network tab or the API response sees one vocabulary, anyone reading the screen sees another. I decided that was acceptable because the API contract belongs to the upstream and I did not feel free to rewrite it. If I owned both sides I would rename the API too.

### 3. Putting the writebacks in a server route handler instead of the client

The brief says I can put the writes wherever makes sense and asks me to explain it. The choices are: do the writes in the client right after the scan succeeds, do them in a Next API route, or do them on the upstream API itself.

Upstream API was off the table. I do not own that surface.

Client-side is simpler. After the ops scan succeeds, fire a POST to the facilities mock, then fire a POST to the finance mock, then update the UI. The client already has the asset's location, so there is nothing to fetch. Two lines of code.

I went with the route handler at `/api/workflows/[action]` instead, for three reasons that all stack:

First, the bearer token. Doing the writes in the client would mean the token has to be exposed to the browser, which violates the "token stays on the server" property I wanted. There are ways to avoid that, like having the client call the same-origin proxy for the writebacks too, but at that point you are already on the server side. Centralizing made the code clearer.

Second, the deploy operation is really one user-meaningful action that emits three writes: the ops scan, the facilities row, and the finance capitalization. If the second write fails after the first has already succeeded, the client either has to silently swallow the failure or expose the partial state. Either choice is bad. Putting the writes in one server function means the partial-failure mode is loggable and surfaceable in one place, not three.

Third, the side-effect summary that appears in the success panel ("Facilities rack assignment written. Finance capitalization written.") is generated by the server route based on what actually completed, not by the client guessing at what should have happened. If a future deploy fails to write to finance, the second line will be absent. That absence will be meaningful.

The trade-off I am absorbing is a tiny bit more code on the server and a slightly slower deploy round-trip, because three sequential writes happen in series instead of in parallel from the client. I think the auditability win is worth that latency.

## Pushback on the brief and the starter

The brief invites pushback and says it is a positive signal. So here is mine, honestly.

**Camera scanning is described as roughly equal to keyboard scanning. It is not.** A handheld USB or Bluetooth scanner is a keyboard emulator. It types into your input and presses Enter. There is essentially nothing for JavaScript to break. Browser camera scanning, on the other hand, depends on `BarcodeDetector` support (Chrome, mostly), lighting conditions, label print quality, the camera's autofocus speed, and whether the page has permission to use the camera at all. I built the keyboard path first-class and treated camera as a progressive enhancement. I would suggest the brief frame them that way.

**The location examples in the brief mix two schemas.** Storage locations look like `Site/Room/Shelf`, three parts. Deploy locations look like `Site/Room/Row/Rack/RU`, five parts. The starter helpers cover both, and the API will reject a deploy that is missing the RU. But a reader who only reads the brief might not realize that deploy is stricter than store. One additional sentence in the brief would catch this.

**The deploy operation is not transactional.** The ops scan commits before the facilities and finance writes. If those subsequent writes fail, the ops state has already moved forward without them. In a real production system this needs either an outbox pattern, a compensating write, or a two-phase commit, and the brief acknowledges that backend hardening is out of scope. I left the partial-write window in place. The risk is that a manager could see an asset's state as `in_service` while finance still says `pending_receipt`, with no way to know from the UI which write failed. I would flag this as the next thing to harden after the prototype.

**`/v1/reset` clears the mock writes along with everything else.** That is documented, but it is the kind of thing you can forget about thirty seconds before recording a Loom. Worth a small reminder on the `/dev/barcodes` page next to the print button. I did not build that reminder, but I should have.

## What I chose not to build

Subtraction is a skill, per the brief. Here is what I decided was not worth building, with reasons:

**Offline scan queueing.** Out of scope explicitly. Also, offline queueing without conflict resolution creates more drift than it removes. If the tech scans a deploy at 11pm on a flaky connection, queues it locally, comes back online at 11:05pm, and submits, the asset might already be in a state where deploy is no longer valid. Now you have a queued action that needs human reconciliation. The right answer is to require connectivity for the write and fail loudly otherwise, which is what the current code does.

**Haptic and audio feedback on scan success.** The visual flash, the shake on error, and the step-dot progression cover the same "did it work?" signal without dragging in a sound library. A tech wearing earbuds or working in a noisy lab is not going to hear a beep anyway.

**A custom barcode renderer.** The starter ships `code128Svg`. It works. Switching to QR or another format would mean a dependency I do not need.

**Smooth scroll on the technician routes.** I added Lenis for smooth scroll on the landing page. I deliberately did not extend it to `/tech/*`. Overriding native scroll on a scanner-first UI fights with focus management, and the tech screens are short enough that smooth scroll does not buy you anything. The landing page is a marketing surface where motion sells the product. The tech routes are a tool. Tools should be predictable.

**RMA flow.** The brief says the state machine supports it but I do not need a UI for it. So I do not have one.

**Authentication.** Out of scope. The cookie-based role switcher in the header (tech-jane versus manager-paul) is enough to demo both perspectives.

## One piece of microcopy I would walk through in the Loom

After a successful deploy, the success panel renders this:

> Facilities rack assignment written.
> Finance capitalization written.

Two lines, not one. Not a generic "Success!" or "Done." Each line names a specific system that the scan moved, and each line is generated by the server based on whether the write actually completed.

Here is what I want a reviewer to notice about this. If a future deploy fails to write to finance but succeeds at facilities, the user-facing message will read:

> Facilities rack assignment written.

One line instead of two. The absence of the second line is meaningful. It is not just shorter, it is a different message. A tech reading the panel can see "wait, only one line, something dropped" and check the reconciliation report.

I want success messages to be diffable against failure messages, not just shorter than them. This is the design property I care about most across the whole app.

## Files worth a reviewer's time, in priority order

| Path | What is interesting |
|---|---|
| `starter/components/TechWorkflows.tsx` | The four scan flows. Step-dot state machine UI, focus-stickiness on the input, asset preview round-trip between scans. |
| `starter/components/ScanInput.tsx` | Small file, but the global `keydown` refocus listener is the call I expect questions on. |
| `starter/app/api/workflows/[action]/route.ts` | Where the writebacks actually happen. Deploy emits both facilities and finance writes; store from `in_service` clears the facilities rack. |
| `starter/app/api/reconcile/route.ts` | The three-way join. Classification rules live here. |
| `starter/components/ReconcileView.tsx` | Severity rename, missing-cell tint, system-by-system layout. |
| `starter/app/dev/barcodes/page.tsx` | The testing matrix, with explanatory notes on each barcode. |
| `starter/app/manager/page.tsx` | Action-first information design. Metric tiles, first-actions panel, then the table. |

## Original challenge docs

- [`docs/CHALLENGE.md`](./docs/CHALLENGE.md)
- [`starter/docs/api-reference.md`](./starter/docs/api-reference.md)
- [`starter/docs/happy-path.md`](./starter/docs/happy-path.md)
