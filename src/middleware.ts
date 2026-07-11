/**
 * Astro middleware — resolves the Better Auth session on every request and
 * publishes it on `Astro.locals.{user,session}` (typed in `src/env.d.ts`).
 *
 * Pages/endpoints read `Astro.locals.user` for auth checks instead of calling
 * getSession themselves. Auth is built per request (D1 binding is request
 * scoped). Failures degrade to a logged-out request rather than 500ing the page.
 */
import { defineMiddleware } from 'astro:middleware'
import { env } from 'cloudflare:workers'
import { createAuth } from '@/shared/auth'

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const auth = createAuth(env)
    const result = await auth.api.getSession({ headers: context.request.headers })
    context.locals.user = result?.user ?? null
    context.locals.session = result?.session ?? null
  } catch {
    context.locals.user = null
    context.locals.session = null
  }
  return next()
})
