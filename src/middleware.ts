/**
 * Astro middleware — three per-request responsibilities:
 *
 * 1. SESSION: resolve the Better Auth session and publish it on
 *    `Astro.locals.{user,session}` (typed in `src/env.d.ts`). Pages/endpoints
 *    read `Astro.locals.user` instead of calling getSession themselves. Auth is
 *    built per request (the D1 binding is request scoped). Failures degrade to
 *    a logged-out request rather than 500ing the page.
 *
 * 2. CSRF DEFENSE-IN-DEPTH: Astro's global `checkOrigin` is off (see
 *    astro.config.mjs — Safari/Better Auth omit `Origin` on some same-origin
 *    POSTs). Primary CSRF protection is the SameSite=Lax session cookie
 *    (cross-site POSTs can't carry it) + JSON-only bodies. On top of that, for
 *    unsafe methods on `/api/*` we reject any request whose `Origin` header is
 *    PRESENT and cross-origin — mismatched-origin requests are never legit,
 *    while absent-Origin same-origin requests keep working.
 *
 * 3. SECURITY HEADERS: Cloudflare Pages' `_headers` file applies ONLY to static
 *    assets, never to Functions (SSR) responses — so every security header for
 *    HTML/API responses must be set here. CSP allows 'unsafe-inline' scripts
 *    because Astro's `define:vars` script on /c/[slug] is inline by design
 *    (content varies per config, so hashes can't be pinned); Google's domains
 *    are allowlisted per docs/TRACKING_SPEC.md §6. Applied in prod only — the
 *    dev server needs Vite's inline HMR scripts + websocket.
 */
import { defineMiddleware } from 'astro:middleware'
import { env } from 'cloudflare:workers'
import { createAuth } from '@/shared/auth'

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' — required by Astro inline scripts (define:vars); see docblock.
  // static.cloudflareinsights.com — Cloudflare Web Analytics auto-injects its
  // beacon at the edge when enabled on the zone (toggle it off in the dashboard
  // if you want the strict nothing-before-consent story; allowing it here just
  // stops CSP console errors while it is on).
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com",
  // 'unsafe-inline' — Astro/Svelte scoped styles + transition style attributes.
  "style-src 'self' 'unsafe-inline'",
  // https: — OAuth avatars (Discord/Google CDNs) + GA image beacons.
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://cloudflareinsights.com",
  // GTM debug/preview badge iframe; everything else stays unframeable.
  'frame-src https://www.googletagmanager.com',
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self'",
  'upgrade-insecure-requests',
].join('; ')

const SECURITY_HEADERS: ReadonlyArray<[string, string]> = [
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
  ['Content-Security-Policy', CSP],
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'],
]

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context

  // (2) Reject unsafe /api/* requests with a mismatched Origin header.
  if (UNSAFE_METHODS.has(request.method) && context.url.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    if (origin && origin !== context.url.origin) {
      return new Response(JSON.stringify({ error: 'cross_origin_forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    }
  }

  // (1) Resolve the session.
  try {
    const auth = createAuth(env)
    const result = await auth.api.getSession({ headers: request.headers })
    context.locals.user = result?.user ?? null
    context.locals.session = result?.session ?? null
  } catch {
    context.locals.user = null
    context.locals.session = null
  }

  const response = await next()

  // (3) Security headers on every SSR response (prod only; dev needs HMR).
  if (import.meta.env.PROD) {
    for (const [name, value] of SECURITY_HEADERS) {
      if (!response.headers.has(name)) response.headers.set(name, value)
    }
  }

  return response
})
