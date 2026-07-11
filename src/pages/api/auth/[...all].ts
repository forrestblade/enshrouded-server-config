/**
 * Better Auth catch-all handler — mounts every `/api/auth/*` endpoint
 * (sign-in, OAuth callbacks, session, sign-out, account linking, ...).
 *
 * Auth is built per request from the Cloudflare runtime env (D1 binding is
 * request-scoped). We forward Cloudflare's real client IP (`cf-connecting-ip`)
 * as `x-forwarded-for` so Better Auth's rate limiting sees it. NOTE: do not use
 * `ctx.clientAddress` here — the Cloudflare adapter throws on it (it has no
 * `clientAddress`); the IP lives in the `cf-connecting-ip` header instead.
 *
 * The incoming request's headers are IMMUTABLE on deployed workerd (dev never
 * hits this: `cf-connecting-ip` only exists behind Cloudflare), so the header
 * is added on a mutable clone — `request.headers.set()` on the original throws
 * "Can't modify immutable headers" and 500s every auth call in production.
 */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { createAuth } from '@/shared/auth'

export const prerender = false

export const ALL: APIRoute = (ctx) => {
  const auth = createAuth(env)
  let request = ctx.request
  if (!request.headers.has('x-forwarded-for')) {
    const ip = request.headers.get('cf-connecting-ip')
    if (ip) {
      request = new Request(request) // mutable clone; body streams through
      request.headers.set('x-forwarded-for', ip)
    }
  }
  return auth.handler(request)
}
