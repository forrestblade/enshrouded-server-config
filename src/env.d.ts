/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

// workers-types v5 dropped the dated snapshot entrypoints (e.g. /2023-07-01);
// the bare package now resolves to index.d.ts with all runtime types.
type D1Database = import('@cloudflare/workers-types').D1Database
type AnalyticsEngineDataset = import('@cloudflare/workers-types').AnalyticsEngineDataset

interface CloudflareEnv {
  DB: D1Database
  ANALYTICS: AnalyticsEngineDataset
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  // OAuth providers at launch: Discord + Google (others deferred).
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  DISCORD_CLIENT_ID: string
  DISCORD_CLIENT_SECRET: string
  TURNSTILE_SITE_KEY: string
  TURNSTILE_SECRET_KEY: string
  PUBLIC_GA4_MEASUREMENT_ID: string
}

// Bindings are accessed via `import { env } from 'cloudflare:workers'` (adapter
// v14 removed `Astro.locals.runtime.env` — it now throws). Merging our bindings
// into `Cloudflare.Env` types that `env` with DB/ANALYTICS/secrets. Do NOT read
// `env` at module top level; only inside request handlers.
declare namespace Cloudflare {
  interface Env extends CloudflareEnv {}
}

// v14 Runtime exposes only `cfContext` (ExecutionContext); it is no longer
// generic. Env comes from `cloudflare:workers`, not from here.
type Runtime = import('@astrojs/cloudflare').Runtime

declare namespace App {
  interface Locals extends Runtime {
    user: import('./entities/session/model/types').SessionUser | null
    session: import('./entities/session/model/types').Session | null
  }
}
