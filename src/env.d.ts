/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types/2023-07-01" />

type D1Database = import('@cloudflare/workers-types/2023-07-01').D1Database
type AnalyticsEngineDataset = import('@cloudflare/workers-types/2023-07-01').AnalyticsEngineDataset

interface CloudflareEnv {
  DB: D1Database
  ANALYTICS: AnalyticsEngineDataset
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  DISCORD_CLIENT_ID: string
  DISCORD_CLIENT_SECRET: string
  TWITCH_CLIENT_ID: string
  TWITCH_CLIENT_SECRET: string
  FACEBOOK_CLIENT_ID: string
  FACEBOOK_CLIENT_SECRET: string
  TWITTER_CLIENT_ID: string
  TWITTER_CLIENT_SECRET: string
  RESEND_API_KEY: string
  EMAIL_FROM: string
  TURNSTILE_SITE_KEY: string
  TURNSTILE_SECRET_KEY: string
  PUBLIC_GA4_MEASUREMENT_ID: string
}

type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>

declare namespace App {
  interface Locals extends Runtime {
    user: import('./lib/auth/types').SessionUser | null
    session: import('./lib/auth/types').Session | null
  }
}
