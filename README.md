# Enshrouded Server Config

Build, share, and discover [Enshrouded](https://enshrouded.zone/) dedicated server
configurations — no hand-editing JSON, no silent config wipes.

> **Why:** Enshrouded silently overwrites `enshrouded_server.json` with defaults if the file has a
> single JSON error. This tool makes an invalid export structurally impossible, and adds accounts,
> sharing, likes, and forking on top.

## Stack
- **Astro 7** (SSR) on **Cloudflare Pages**
- **Svelte 5** islands for the interactive editor
- **Cloudflare D1** (SQLite) + **Drizzle ORM**, FTS5 search
- **Better Auth** — OAuth-only (Discord + Google) with account linking
- **Consent-gated GTM + GA4** (Consent Mode v2) — zero tracking before explicit consent,
  GPC/DNT always honored. Spec: [`docs/TRACKING_SPEC.md`](docs/TRACKING_SPEC.md)
- **Zod** schema as the single source of truth for validation, types, UI ranges, and export shape
- **Vitest** over the entities layer (schema bounds, presets, export, slugs, secret-stripping)

## Develop
```bash
pnpm install
cp .dev.vars.example .dev.vars     # fill in secrets
pnpm db:migrate:local              # apply D1 migrations locally
pnpm dev                           # http://localhost:4321
```

```bash
pnpm test        # unit tests (Vitest)
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm check       # astro check
```

## Deploy
Cloudflare Pages, git-connected to `main`. Full checklist (D1 id, env vars, OAuth redirects,
post-deploy smoke): [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Docs
- [`docs/TRACKING_SPEC.md`](docs/TRACKING_SPEC.md) — authoritative analytics spec (GA4 + GTM setup)
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — deployment checklist
- [`docs/reference/enshrouded-schema.md`](docs/reference/enshrouded-schema.md) — config field spec
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — build history and task log

---

Crafted by [forrestblade.com](https://forrestblade.com).
