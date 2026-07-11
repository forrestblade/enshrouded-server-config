# TRACKING SPEC — Analytics event + setup handoff

_Authoritative spec for this site's analytics. Covers what the app emits, the consent/privacy
behaviour, and **everything to set up in GA4, GTM, and Cloudflare** to make it report. If you only
read one analytics doc, read this one. Supersedes the "invisible analytics / Analytics Engine
dashboard" design in `docs/MARTECH_HANDOFF.md` (see "What changed" at the bottom)._

---

## 1. Architecture in one paragraph

Analytics run **entirely through consent-gated Google Tag Manager + GA4**. There is **no first-party
pipeline and no custom dashboard** — GA4 owns reporting. On the client, nothing from Google loads
until the visitor **grants consent**; on grant we push **Consent Mode v2** signals and inject the GTM
container and/or the GA4 tag. Product interactions (publish, like, fork, download, copy) are pushed to
`window.dataLayer` for GTM to route into GA4. Pageviews and site search are handled by **GA4 Enhanced
Measurement** (no code).

```
consent granted ──► push Consent Mode v2 default:denied ──► update analytics_storage:granted
                └─► inject GTM (GTM-5H9R96VX) and/or GA4 gtag (G-3PJG33PRF6)
user action ─────► window.dataLayer.push({ event, ...params }) ──► GTM trigger ──► GA4 event
pageview / search ─────────────────────────────────────────────► GA4 Enhanced Measurement
```

**The two IDs (public — they ship to the browser):**

| Purpose | Env var | Value |
|---|---|---|
| GTM container | `PUBLIC_GTM_CONTAINER_ID` | `GTM-5H9R96VX` |
| GA4 measurement | `PUBLIC_GA4_MEASUREMENT_ID` | `G-3PJG33PRF6` |

> ⚠️ **Double-count rule.** Configure GA4 **page_view in exactly one place**. If you keep the direct
> GA4 id populated (the default), do **not** also add a GA4 **Configuration / page_view** tag for the
> same property inside GTM — that fires page_view twice. See §5 for the two clean setups.

---

## 2. Consent + privacy behaviour (non-negotiable — this is the product thesis)

- **Nothing loads or collects before consent.** GTM and GA4 scripts are injected only after the
  visitor clicks **Accept** in the consent banner. The consent decision is cookieless
  (`localStorage` key `esc:consent:v1`).
- **GPC / DNT = hard off.** If the browser sends Global Privacy Control (`navigator.globalPrivacyControl === true`)
  or Do Not Track (`navigator.doNotTrack === '1'`), nothing is collected **even if** localStorage says
  granted. The stored decision can only loosen collection, never override a browser opt-out.
- **Consent Mode v2**, pushed before any tag initialises:
  `consent default` = everything **denied**, then `consent update` = **`analytics_storage: granted`
  only**. This site has no ads, so `ad_storage`, `ad_user_data`, `ad_personalization` **stay denied
  forever**. Revoking pushes `analytics_storage: denied`.
- **No `<noscript>` GTM iframe.** Our consent gate is JavaScript-based, so a no-JS iframe could not
  honour it — it is deliberately omitted.
- Revoking consent cannot unload GTM/GA4 mid-session (browser limitation), but Consent Mode stops
  consent-aware tags from collecting. A full reload after revoke starts clean.

---

## 3. Event catalog

### 3a. Handled automatically by GA4 Enhanced Measurement — **do not instrument in code**

| GA4 event | How | Setup |
|---|---|---|
| `page_view` (incl. SPA nav) | Enhanced Measurement "page changes based on browser history events". Astro's `<ClientRouter/>` uses the History API, which GA4 detects. | §4, must be **ON** |
| `view_search_results` | Enhanced Measurement site search on the `q` query param of `/browse?q=…` | §4, `q` is a default term |
| `scroll`, `click` (outbound), `file_download` (generic) | Enhanced Measurement defaults | §4 |

### 3b. Custom product events — pushed to `window.dataLayer`

Emitted by `track()` (`src/features/analytics/lib/track.ts`), only when tracking is allowed. Each is a
`dataLayer.push`. **All params are PII-free** (no user id, email, IP, or free text).

| `event` | Fires when | Params (dataLayer keys) | Emitted from |
|---|---|---|---|
| `publish` | A config is published successfully | `config_slug`, `visibility` (`public`\|`unlisted`\|`private`) | `features/publish-config/ui/PublishDialog.svelte` |
| `like` | A like is toggled (server-reconciled) | `config_slug`, `like_state` (`on`\|`off`) | `features/like-config/ui/LikeButton.svelte` |
| `fork` | "Fork to editor" is clicked | `config_slug` | `features/fork-config/lib/fork.ts` |
| `download` | "Download" JSON on a config detail page | `config_slug` | `pages/c/[slug].astro` (`data-esc-track`) |
| `copy` | "Copy JSON" on a config detail page | `config_slug` | `pages/c/[slug].astro` (`data-esc-track`) |

**Exact payload shapes** (what GTM will see):

```js
{ event: 'publish',  config_slug: 'hardcore-no-tombstone', visibility: 'public' }
{ event: 'like',     config_slug: 'hardcore-no-tombstone', like_state: 'on' }
{ event: 'fork',     config_slug: 'hardcore-no-tombstone' }
{ event: 'download', config_slug: 'hardcore-no-tombstone' }
{ event: 'copy',     config_slug: 'hardcore-no-tombstone' }
```

Declarative buttons use `data-esc-track="copy|download"` + `data-esc-track-slug="<slug>"`; a single
document click listener (in `init.ts`) forwards them, so it survives SPA navigation. Event names are
**append-only** — see `src/features/analytics/model/events.ts`.

---

## 4. GA4 setup (property `G-3PJG33PRF6`)

1. **Data stream.** Admin → Data streams → confirm a **Web** stream for `enshroudedserverconfig.com`
   with Measurement ID **G-3PJG33PRF6**.
2. **Enhanced Measurement** (stream → Enhanced Measurement → gear):
   - ✅ **Page views** — and open the sub-options, ensure ✅ **"Page changes based on browser history
     events"** (this is what captures Astro SPA navigations).
   - ✅ **Site search** — confirm `q` is in the query-parameter list (it is by default).
   - Scroll / outbound clicks / file downloads: enable as desired.
3. **Consent Mode.** GA4 automatically honours the Consent Mode signals we push. No toggle needed;
   optionally Admin → Data settings → confirm behaviour under denied consent. Since we only grant
   `analytics_storage`, expect **cookieless pings** to become full analytics after grant.
4. **Register custom dimensions** (Admin → Custom definitions → Create custom dimension), all
   **event-scoped**, so the params show up in reports:
   - `config_slug` → event parameter `config_slug`
   - `visibility` → event parameter `visibility`
   - `like_state` → event parameter `like_state`
5. **Key events / conversions** (Admin → Key events): mark `publish` and `fork` (and any others you
   care about) as key events.
6. **Verify** in **Admin → DebugView** (see §7).

---

## 5. GTM setup (container `GTM-5H9R96VX`)

Pick **one** of two clean configurations. **Setup A is recommended.**

### Setup A — everything in GTM (recommended; blank the direct GA4 id)

Set `PUBLIC_GA4_MEASUREMENT_ID=""` so the direct gtag does **not** load; GTM owns GA4 entirely.

1. **Consent (built-in).** GTM → Container settings → ✅ **Enable consent overview**. Our code already
   pushes `consent default/update`, so tags with default consent checks behave correctly. Set GA4
   tags to require **`analytics_storage`** (Consent Settings → "Require additional consent").
2. **GA4 Configuration tag** — Tag type *Google Tag*, Tag ID `G-3PJG33PRF6`, trigger **Initialization
   – All Pages** (or Consent Initialization). This fires `page_view`.
3. **Data Layer Variables** — create `DLV - config_slug` (`config_slug`), `DLV - visibility`
   (`visibility`), `DLV - like_state` (`like_state`).
4. **Custom Event triggers** — one per event: trigger type *Custom Event*, Event name = `publish`,
   `like`, `fork`, `download`, `copy` (five triggers). Or a single trigger with the regex
   `^(publish|like|fork|download|copy)$`.
5. **GA4 Event tags** — a *GA4 Event* tag per event (or one tag using `{{Event}}` as the event name).
   Map params: `config_slug` = `{{DLV - config_slug}}`, plus `visibility` (publish) / `like_state`
   (like). Attach the matching Custom Event trigger(s).
6. **Publish** the container.

### Setup B — direct GA4 for pageviews + GTM for custom events only (both ids populated, the default)

Keep both env ids. The **direct gtag** (loaded by our code) handles `page_view` + Enhanced
Measurement. GTM sends **only** the custom events — so **do NOT** add a GA4 Configuration/page_view
tag in GTM.

1. Steps 1, 3, 4 from Setup A (consent, Data Layer Variables, Custom Event triggers).
2. **GA4 Event tags** as in Setup A step 5, but on each event tag set **Measurement ID = `G-3PJG33PRF6`
   directly** (GA4 Event tags allow a measurement ID without a separate config tag). This routes the
   custom events to the same property without a second page_view.
3. **Publish.** Because there is no page_view tag in GTM, page_view fires exactly once (from the direct
   gtag). ✅ No double count.

> The app supports both setups with no code change — it just loads whichever ids are non-empty. The
> only rule is the §1 double-count rule: page_view in exactly one place.

---

## 6. Cloudflare setup

1. **Pages env vars.** Project → Settings → Environment variables. Add for **both** Production and
   Preview:
   - `PUBLIC_GTM_CONTAINER_ID = GTM-5H9R96VX`
   - `PUBLIC_GA4_MEASUREMENT_ID = G-3PJG33PRF6` (or empty for Setup A)
   These are read per-request by the Layout (`import { env } from 'cloudflare:workers'`) and passed to
   the tracker island. They are **public** values (they reach the browser), not secrets.
2. **No Analytics Engine.** The old first-party event sink was removed; there is **no**
   `analytics_engine_datasets` binding to configure. If you ever want a first-party warehouse
   (e.g. for Grafana), that is a separate build.
3. **Content-Security-Policy.** If/when a CSP is added, allowlist Google's endpoints, e.g.:
   - `script-src https://www.googletagmanager.com`
   - `img-src https://*.google-analytics.com https://*.googletagmanager.com`
   - `connect-src https://*.google-analytics.com https://*.googletagmanager.com https://*.analytics.google.com`
   - `frame-src https://www.googletagmanager.com` (only if you later add server-side/2nd-party frames)
   There is no CSP today, so nothing to change yet.
4. Local dev reads the same vars from `.dev.vars` (already populated).

---

## 7. How to verify

**Local (`pnpm dev` → http://localhost:4321):**
1. Open DevTools → Network. Before clicking anything, filter `google` — **nothing** should load.
2. Click the cookie button → **Accept all**. Now `gtm.js?id=GTM-5H9R96VX` and (Setup B)
   `gtag/js?id=G-3PJG33PRF6` load.
3. Console: `window.dataLayer` — you should see a `['consent','default',{…denied}]` entry **before**
   `['consent','update',{analytics_storage:'granted'}]`.
4. Publish a config / like / fork / copy / download → see the matching `{event:…}` object appended to
   `window.dataLayer`.
5. **GPC test:** in a browser with Global Privacy Control on (or set `navigator.globalPrivacyControl`),
   Accept, and confirm nothing loads.

**GA4:** Admin → **DebugView**. Add `?gtm_debug=x` or use the GA4/Tag Assistant debug, perform the
actions, and confirm `page_view`, `view_search_results`, and the custom events (with `config_slug`
etc.) arrive. **GTM Preview** (Tag Assistant) shows each trigger firing.

**Headless (gating + Consent Mode ordering), the repo convention:**
```bash
# write a bundled test entry that mocks window/navigator/localStorage/document,
# then imports @/features/analytics/* and asserts gating + dataLayer + consent order:
node_modules/.bin/esbuild <entry>.ts --bundle --platform=node --format=esm \
  --outfile=out.mjs --tsconfig=tsconfig.json && node out.mjs
```
The last such run asserted 20 checks: denied/GPC/DNT gating blocks pushes; granted+clean pushes one
snake_case event; `consent default (denied)` precedes `consent update (granted)`; only
`analytics_storage` is granted; GTM + GA4 scripts are injected; revoke sets `analytics_storage`
denied. (Node 26's `navigator` global is a read-only getter — set it via `Object.defineProperty`.)

---

## 8. Code map

```
src/features/analytics/
  model/events.ts        # event-name catalog + TrackParams → snake_case dataLayer keys
  lib/track.ts           # track(event, params): consent + GPC/DNT gate, dataLayer.push
  lib/consent-mode.ts    # shared gtag shim + Consent Mode v2 default(denied)/update
  lib/gtm.ts             # GTM container loader (loadGtm)
  lib/ga4.ts             # direct GA4 gtag loader (loadGa4)
  lib/third-party.ts     # orchestrator: consent defaults → grant → load GTM/GA4
  lib/init.ts            # one-time wiring: consent reactions + click delegation
  ui/AnalyticsTracker.svelte  # client:idle island, mounts init once
  index.ts               # client-safe barrel
src/app/layouts/Layout.astro   # reads PUBLIC_GTM/GA4 ids from env, renders the island
src/features/consent/           # the consent gate (banner + localStorage)
```

---

## 9. Owner decisions to confirm

- **Which setup** — A (GA4 fully in GTM, blank `PUBLIC_GA4_MEASUREMENT_ID`) or B (direct GA4 + GTM for
  custom events). Default in env is **B** (both ids populated). Either works; just honour the
  double-count rule.
- Whether to mark additional events as GA4 **key events** (default suggestion: `publish`, `fork`).
- Register the three **custom dimensions** (§4.4) or reporting won't show `config_slug` etc.

## What changed vs `docs/MARTECH_HANDOFF.md`

That doc specced a first-party **Cloudflare Analytics Engine** beacon + an admin **dashboard**. Per
owner direction ("we don't need any kind of dashboard — GA4 handles that"), those were **removed**:
the `/api/analytics` beacon, the `ANALYTICS` binding, the dashboard, admin gating, and the AE SQL
read-back are all gone. The consent gate, GPC/DNT rules, and Consent Mode v2 discipline were **kept**
and now front GTM + GA4 instead of a bespoke pipeline.
