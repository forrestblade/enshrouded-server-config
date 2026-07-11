# Enshrouded Server Config — Rebuild Plan (locked)

/ Crafted by [forrestblade.com](https://forrestblade.com)

## Stack (all decisions final)
- **Framework:** Astro 5 (SSR) + `@astrojs/cloudflare` adapter
- **Islands:** Svelte 5 (runes) — used for the config editor + interactive social bits
- **DB:** Cloudflare **D1 (SQLite)** via **Drizzle ORM**; search via **FTS5**
- **Auth:** Better Auth — OAuth-only, passwordless, + magic link (email via Resend HTTP API)
  - Providers: Google, Discord, Twitch, Facebook, X/Twitter
  - **Account linking** enabled → one user, many linked providers
- **Bot gating:** Cloudflare Turnstile on write endpoints
- **Analytics:** first-class primitive, **zero tracking before consent** (strict). GA4 + first-party
  events both gated behind an explicit consent grant. Consent Mode v2 signals wired for GA4.
- **Hosting:** Cloudflare Pages, domain `enshroudedserverconfig.com`
- **Attribution:** sleek footer credit backlinking `forrestblade.com`
- Valence fully removed.

## Source of truth
The user-provided standalone HTML generator (pre-Valence) is authoritative for the Enshrouded
config schema: field names, defaults, ranges, enums, nanosecond durations, and JSON output shape,
including `userGroups[]` (name, password, canKickBan, canAccessInventories, canEditBase,
canExtendBase, reservedSlots) and the top-level server identity + network fields.

Critical product thesis: Enshrouded **silently overwrites the config with defaults if the JSON is
invalid**. The hero feature is a typed schema that makes an invalid/malformed export structurally
impossible (range + enum enforcement, strict JSON, "Custom preset" gotcha surfaced in UI).

## Phases
0. Foundation: scaffold Astro+Cloudflare+Svelte, Drizzle+D1 schema, design tokens, CI to Pages.
1. Config core: typed Enshrouded schema module (source of truth), editor island, JSON export,
   local (unauth) drafts, presets (Default/Relaxed/Hard/Survival/Custom + Casual/Balanced/Hardcore).
2. Auth + accounts: Better Auth, 5 providers, account linking, magic link, /account + profiles.
3. Social: publish/share, browse + FTS5 search, likes, fork/clone, tags, public profiles.
4. Analytics + consent: dormant-by-default pipeline, CMP banner, GA4 gated, admin dashboard, Turnstile.
5. Polish: SEO/sitemap/OG, View Transitions, a11y, perf, launch.

## Env / secrets required from owner before production
Cloudflare account + D1 binding, Pages project; OAuth client id/secret for Google, Discord, Twitch,
Facebook, X; Resend API key + from-address; GA4 measurement id; Turnstile site+secret keys.
