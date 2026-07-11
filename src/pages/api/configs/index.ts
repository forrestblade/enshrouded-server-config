/**
 * /api/configs — publish (POST) a config to the browse gallery.
 *
 * Auth required (checked via Astro.locals.user, set by middleware). Body is
 * validated by publishInputSchema; the stored config is secret-stripped in the
 * repo. Rate limited per user (count of recent publishes — 429 over the cap) so
 * an authenticated script can't flood D1/FTS with junk rows. Browse/search is
 * served SSR by `/browse` (repo.listConfigs), so there is no GET here.
 */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getDb } from '@/shared/db'
import { json } from '@/shared/lib/http'
import { publishInputSchema } from '@/entities/shared-config'
import { publishConfig, countRecentPublishes } from '@/entities/shared-config/api/repo'

export const prerender = false

/** Max publishes per user per hour — generous for a human, hostile to a loop. */
const PUBLISHES_PER_HOUR = 10

export const POST: APIRoute = async (ctx) => {
  const user = ctx.locals.user
  if (!user) return json({ error: 'unauthorized' }, 401)

  let body: unknown
  try {
    body = await ctx.request.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const parsed = publishInputSchema.safeParse(body)
  if (!parsed.success) {
    return json({ error: 'invalid', issues: parsed.error.issues }, 422)
  }

  const db = getDb(env.DB)

  const recent = await countRecentPublishes(db, user.id)
  if (recent >= PUBLISHES_PER_HOUR) {
    return json({ error: 'rate_limited' }, 429)
  }

  const { slug } = await publishConfig(db, user.id, parsed.data)
  return json({ slug }, 201)
}
