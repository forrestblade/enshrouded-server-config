/**
 * Better Auth catch-all handler — mounts every `/api/auth/*` endpoint
 * (sign-in, OAuth callbacks, session, sign-out, account linking, ...).
 *
 * Auth is built per request from the Cloudflare runtime env (D1 binding is
 * request-scoped). We forward Cloudflare's real client IP (`cf-connecting-ip`)
 * as `x-forwarded-for` so Better Auth's rate limiting sees it. NOTE: do not use
 * `ctx.clientAddress` here — the Cloudflare adapter throws on it (it has no
 * `clientAddress`); the IP lives in the `cf-connecting-ip` header instead.
 */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { createAuth } from '@/shared/auth'

export const prerender = false

export const ALL: APIRoute = (ctx) => {
  const auth = createAuth(env)
  const { request } = ctx
  if (!request.headers.has('x-forwarded-for')) {
    const ip = request.headers.get('cf-connecting-ip')
    if (ip) request.headers.set('x-forwarded-for', ip)
  }
  return auth.handler(request)
}
