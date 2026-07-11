/**
 * /api/configs/[slug] — DELETE a config you own.
 *
 * Auth required; ownership enforced in the repo (403 if not yours, 404 if gone).
 * Removes tags/likes/fts + nulls fork lineage. Same-origin only (Astro CSRF).
 */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/shared/db'
import { json } from '@/shared/lib/http'
import { deleteConfig } from '@/entities/shared-config/api/repo'

export const prerender = false

export const DELETE: APIRoute = async (ctx) => {
  const user = ctx.locals.user
  if (!user) return json({ error: 'unauthorized' }, 401)

  const slug = ctx.params.slug
  if (!slug) return json({ error: 'not_found' }, 404)

  const db = getDb(env.DB)
  const result = await deleteConfig(db, user.id, slug)
  if (result === 'not_found') return json({ error: 'not_found' }, 404)
  if (result === 'forbidden') return json({ error: 'forbidden' }, 403)
  return json({ ok: true })
}
