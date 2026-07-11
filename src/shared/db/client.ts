/**
 * db/client — Drizzle client bound to the request's D1 binding.
 *
 * D1 bindings live on the Cloudflare runtime env (per request), so the client
 * is created per request, never as a module singleton. Astro routes get the
 * binding from `Astro.locals.runtime.env.DB`; pass it here.
 *
 *   import { getDb } from '@/shared/db'
 *   const db = getDb(locals.runtime.env.DB)
 */
import { drizzle } from 'drizzle-orm/d1'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from './schema'

export type Db = DrizzleD1Database<typeof schema>

export function getDb (binding: D1Database): Db {
  return drizzle(binding, { schema })
}
