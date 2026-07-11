# Enshrouded Server Config

Build, share, and discover [Enshrouded](https://enshrouded.zone/) dedicated server
configurations — no hand-editing JSON, no silent config wipes.

> **Why:** Enshrouded silently overwrites `enshrouded_server.json` with defaults if the file has a
> single JSON error. This tool makes an invalid export structurally impossible, and adds accounts,
> sharing, likes, and forking on top.

## Stack
- **Astro 5** (SSR) on **Cloudflare Pages**
- **Svelte 5** islands for the interactive editor
- **Cloudflare D1** (SQLite) + **Drizzle ORM**
- **Better Auth** — OAuth-only (Discord + Google at launch) with account linking
- **Consent-gated analytics** — zero tracking before explicit consent
- **Cloudflare Turnstile** bot gating

## Develop
```bash
pnpm install
cp .dev.vars.example .dev.vars     # fill in secrets
pnpm dev                           # http://localhost:4321
```

See [`docs/HANDOFF.md`](docs/HANDOFF.md) for current build state and the ordered task list, and
[`docs/reference/enshrouded-schema.md`](docs/reference/enshrouded-schema.md) for the authoritative
config field spec.

## Status
Mid-rewrite from a legacy Valence app to the Astro/Cloudflare stack above. Foundation scaffolded;
feature build in progress.

---

Crafted by [forrestblade.com](https://forrestblade.com).
