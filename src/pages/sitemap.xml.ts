/**
 * /sitemap.xml — dynamic sitemap (SSR).
 *
 * @astrojs/sitemap only covers prerendered pages, and this site's indexable
 * surface is mostly DYNAMIC (public config pages), so the sitemap is a live
 * endpoint: static routes + up to 1000 newest public configs from D1. Unlisted
 * and private configs are excluded by the visibility filter (they are also
 * noindex'd at the page level). Cached for an hour at the edge.
 */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { desc, eq } from 'drizzle-orm'
import { getDb, serverConfig } from '@/shared/db'

export const prerender = false

const STATIC_PATHS = ['/', '/editor', '/browse', '/about']

const xmlEscape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const GET: APIRoute = async (ctx) => {
  const site = (ctx.site ?? new URL('https://enshroudedserverconfig.com')).origin

  const db = getDb(env.DB)
  const configs = await db
    .select({ slug: serverConfig.slug, updatedAt: serverConfig.updatedAt })
    .from(serverConfig)
    .where(eq(serverConfig.visibility, 'public'))
    .orderBy(desc(serverConfig.createdAt))
    .limit(1000)

  const urls: string[] = [
    ...STATIC_PATHS.map((p) => `  <url><loc>${site}${p}</loc></url>`),
    ...configs.map((c) => {
      const lastmod = c.updatedAt.toISOString().slice(0, 10)
      return `  <url><loc>${site}/c/${xmlEscape(c.slug)}</loc><lastmod>${lastmod}</lastmod></url>`
    }),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
