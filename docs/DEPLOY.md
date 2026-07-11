# DEPLOY — Cloudflare Pages checklist

The site deploys as a git-connected Cloudflare Pages project building `origin/main`.

## Why the first deploy failed (2026-07-11)

The Pages build log showed `enshrouded-server-config@1.0.0`, `@valencets/*` deps, and a `tsc`
build — that is the OLD Valence app. Local `main` (the Astro rewrite) had never been pushed, so
Pages was building the last pushed commit (`97195e5`). Fix: push `main`. No Pages settings change
is needed — `pnpm run build` resolves to `astro build` in the new `package.json`.

## One-time setup

1. **Push the code.** `git push origin main` (fast-forward; Pages auto-builds on push).
2. **Create the production D1 database:**
   ```bash
   wrangler d1 create enshrouded_config
   ```
   Paste the returned id into `wrangler.toml` → `database_id` (currently a placeholder), commit,
   then apply migrations:
   ```bash
   pnpm db:migrate:remote
   ```
3. **Pages project settings** (dashboard → the Pages project):
   - Build command: `pnpm run build` · Output dir: `dist` (matches `pages_build_output_dir`).
   - **Environment variables** (Production AND Preview):

     | Var | Value | Secret? |
     |---|---|---|
     | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` | yes |
     | `BETTER_AUTH_URL` | `https://enshroudedserverconfig.com` | no |
     | `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | from the Discord app | id no / secret yes |
     | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud OAuth | id no / secret yes |
     | `PUBLIC_GTM_CONTAINER_ID` | your GTM container id | no (public) |
     | `PUBLIC_GA4_MEASUREMENT_ID` | GA4 id, or `""` for GTM-only (Setup A) | no (public) |

4. **OAuth redirect URIs.** Add the production callback to both providers:
   - Discord: `https://enshroudedserverconfig.com/api/auth/callback/discord`
   - Google: `https://enshroudedserverconfig.com/api/auth/callback/google`
   (Keep the localhost ones for dev.)
5. **Custom domain.** Pages → Custom domains → `enshroudedserverconfig.com` (+ `www` redirect if
   wanted).

## Per-deploy verification

- `/` renders, `/about` is not a 404, `/sitemap.xml` returns XML, `/robots.txt` points at it.
- Response headers on `/` include `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Frame-Options` (set by `src/middleware.ts`; Pages `_headers` only covers static assets).
- No `googletagmanager.com` request before accepting the consent panel; one after.
- Sign-in round-trips through Discord and Google.
- Publish → the new config appears on `/browse` and its `/c/[slug]` page loads.
