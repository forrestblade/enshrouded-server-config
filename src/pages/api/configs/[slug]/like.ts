/**
 * /api/configs/[slug]/like — toggle the viewer's like on a config (POST).
 *
 * Auth required. Returns the new liked state + rolled-up likeCount so the client
 * button can reconcile against the server (optimistic UI corrects here).
 */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/shared/db'
import { json } from '@/shared/lib/http'
import { toggleLike } from '@/entities/shared-config/api/repo'

export const prerender = false

export const POST: APIRoute = async (ctx) => {
  const user = ctx.locals.user
  if (!user) return json({ error: 'unauthorized' }, 401)

  const slug = ctx.params.slug
  if (!slug) return json({ error: 'not_found' }, 404)

  const db = getDb(env.DB)
  const result = await toggleLike(db, user.id, slug)
  if (!result) return json({ error: 'not_found' }, 404)
  return json(result)
}
