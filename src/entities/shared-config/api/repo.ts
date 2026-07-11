/**
 * shared-config / api / repo — D1 data access for published configs (SERVER ONLY).
 *
 * Owns publish, browse/search (FTS5), detail, likes, fork lineage, tags, and
 * per-user listings. FTS search goes through `server_config_fts` (raw SQL, since
 * MATCH + rank aren't expressible in the query builder); everything else uses the
 * Drizzle builder. Lists are hydrated with authors + tags in batched IN-queries
 * (no N+1). Raw-SQL rows return unix-second integers for dates, so we convert.
 */
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import type { Db } from '@/shared/db'
import { serverConfig, tag, configTag, like, user } from '@/shared/db'
import { serverConfigSchema, defaultServerConfig } from '@/entities/server-config'
import { buildConfigSlug, tagSlug } from '../lib/slug'
import { toShareableConfig } from '../lib/shareable'
import type {
  ConfigAuthor,
  ConfigDetail,
  ConfigListItem,
  ConfigSort,
  PublishInput,
  TagFacet,
} from '../model/types'

const newId = (): string => crypto.randomUUID()

const listCols = {
  id: serverConfig.id,
  slug: serverConfig.slug,
  title: serverConfig.title,
  summary: serverConfig.summary,
  serverName: serverConfig.serverName,
  gameSettingsPreset: serverConfig.gameSettingsPreset,
  likeCount: serverConfig.likeCount,
  viewCount: serverConfig.viewCount,
  createdAt: serverConfig.createdAt,
  userId: serverConfig.userId,
}

interface BaseRow {
  id: string
  slug: string
  title: string
  summary: string | null
  serverName: string
  gameSettingsPreset: string
  likeCount: number
  viewCount: number
  createdAt: Date
  userId: string
}

/** Safe FTS5 MATCH query: alphanumeric tokens with prefix wildcards, implicit AND. */
function buildMatch (q: string): string | null {
  const tokens = q.toLowerCase().match(/[a-z0-9]+/g)
  if (!tokens || tokens.length === 0) return null
  return tokens.slice(0, 8).map((t) => `${t}*`).join(' ')
}

async function upsertTags (db: Db, names: string[]): Promise<string[]> {
  const bySlug = new Map<string, string>()
  for (const name of names) {
    const slug = tagSlug(name)
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name.trim())
  }
  if (bySlug.size === 0) return []
  const slugs = [...bySlug.keys()]
  const existing = await db
    .select({ id: tag.id, slug: tag.slug })
    .from(tag)
    .where(inArray(tag.slug, slugs))
  const idBySlug = new Map(existing.map((t) => [t.slug, t.id]))
  const toCreate: Array<{ id: string, name: string, slug: string }> = []
  for (const [slug, name] of bySlug) {
    if (!idBySlug.has(slug)) {
      const id = newId()
      idBySlug.set(slug, id)
      toCreate.push({ id, name, slug })
    }
  }
  if (toCreate.length > 0) await db.insert(tag).values(toCreate)
  return slugs.map((slug) => idBySlug.get(slug)).filter((v): v is string => Boolean(v))
}

async function hydrateList (db: Db, rows: BaseRow[]): Promise<ConfigListItem[]> {
  if (rows.length === 0) return []
  const userIds = [...new Set(rows.map((r) => r.userId))]
  const configIds = rows.map((r) => r.id)

  const authors = await db
    .select({ id: user.id, username: user.username, displayUsername: user.displayUsername, image: user.image })
    .from(user)
    .where(inArray(user.id, userIds))
  const authorById = new Map<string, ConfigAuthor>(
    authors.map((a) => [a.id, { username: a.username, displayUsername: a.displayUsername, image: a.image }])
  )

  const tagRows = await db
    .select({ configId: configTag.configId, name: tag.name })
    .from(configTag)
    .innerJoin(tag, eq(tag.id, configTag.tagId))
    .where(inArray(configTag.configId, configIds))
  const tagsByConfig = new Map<string, string[]>()
  for (const row of tagRows) {
    const arr = tagsByConfig.get(row.configId) ?? []
    arr.push(row.name)
    tagsByConfig.set(row.configId, arr)
  }

  const fallbackAuthor: ConfigAuthor = { username: null, displayUsername: null, image: null }
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    serverName: r.serverName,
    gameSettingsPreset: r.gameSettingsPreset,
    likeCount: r.likeCount,
    viewCount: r.viewCount,
    createdAt: r.createdAt,
    author: authorById.get(r.userId) ?? fallbackAuthor,
    tags: tagsByConfig.get(r.id) ?? [],
  }))
}

export async function publishConfig (db: Db, userId: string, input: PublishInput): Promise<{ slug: string }> {
  const shareable = toShareableConfig(input.config)
  const id = newId()
  const slug = buildConfigSlug(input.title)

  let forkedFromId: string | null = null
  if (input.forkedFromSlug) {
    const src = await db
      .select({ id: serverConfig.id })
      .from(serverConfig)
      .where(eq(serverConfig.slug, input.forkedFromSlug))
      .limit(1)
    forkedFromId = src[0]?.id ?? null
  }

  await db.insert(serverConfig).values({
    id,
    userId,
    slug,
    title: input.title,
    summary: input.summary ? input.summary : null,
    serverName: shareable.name,
    gameSettingsPreset: shareable.gameSettingsPreset,
    config: JSON.stringify(shareable),
    visibility: input.visibility,
    forkedFromId,
  })

  const tagIds = await upsertTags(db, input.tags)
  if (tagIds.length > 0) {
    await db.insert(configTag).values(tagIds.map((tagId) => ({ configId: id, tagId })))
  }

  return { slug }
}

export async function listConfigs (
  db: Db,
  opts: { q?: string, tag?: string, sort?: ConfigSort, limit?: number, offset?: number } = {}
): Promise<ConfigListItem[]> {
  const limit = Math.min(opts.limit ?? 24, 50)
  const offset = Math.max(opts.offset ?? 0, 0)
  const match = opts.q ? buildMatch(opts.q) : null

  if (match) {
    const res = await db.all<Record<string, unknown>>(sql`
      SELECT s.id, s.slug, s.title, s.summary,
             s.server_name AS serverName, s.game_settings_preset AS gameSettingsPreset,
             s.like_count AS likeCount, s.view_count AS viewCount,
             s.created_at AS createdAt, s.user_id AS userId
      FROM server_config_fts f
      JOIN server_config s ON s.id = f.config_id
      WHERE server_config_fts MATCH ${match} AND s.visibility = 'public'
      ORDER BY rank
      LIMIT ${limit} OFFSET ${offset}
    `)
    const rows: BaseRow[] = res.map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title),
      summary: r.summary == null ? null : String(r.summary),
      serverName: String(r.serverName),
      gameSettingsPreset: String(r.gameSettingsPreset),
      likeCount: Number(r.likeCount),
      viewCount: Number(r.viewCount),
      createdAt: new Date(Number(r.createdAt) * 1000),
      userId: String(r.userId),
    }))
    return hydrateList(db, rows)
  }

  // Stable rowid tiebreaker so same-second publishes still sort newest-first
  // (timestamps are second-granularity). Qualified for the tag-filter join.
  const recentOrder = [desc(serverConfig.createdAt), sql`server_config.rowid desc`]
  const order = opts.sort === 'popular' ? [desc(serverConfig.likeCount), ...recentOrder] : recentOrder

  if (opts.tag) {
    const rows = await db
      .select(listCols)
      .from(serverConfig)
      .innerJoin(configTag, eq(configTag.configId, serverConfig.id))
      .innerJoin(tag, eq(tag.id, configTag.tagId))
      .where(and(eq(serverConfig.visibility, 'public'), eq(tag.slug, opts.tag)))
      .orderBy(...order)
      .limit(limit)
      .offset(offset)
    return hydrateList(db, rows)
  }

  const rows = await db
    .select(listCols)
    .from(serverConfig)
    .where(eq(serverConfig.visibility, 'public'))
    .orderBy(...order)
    .limit(limit)
    .offset(offset)
  return hydrateList(db, rows)
}

export async function listByUser (
  db: Db,
  username: string,
  opts: { includeNonPublic?: boolean } = {}
): Promise<ConfigListItem[]> {
  const users = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1)
  const owner = users[0]
  if (!owner) return []
  const where = opts.includeNonPublic
    ? eq(serverConfig.userId, owner.id)
    : and(eq(serverConfig.userId, owner.id), eq(serverConfig.visibility, 'public'))
  const rows = await db
    .select(listCols)
    .from(serverConfig)
    .where(where)
    .orderBy(desc(serverConfig.createdAt), sql`server_config.rowid desc`)
    .limit(50)
  return hydrateList(db, rows)
}

/** All of a user's configs (any visibility), by user id — for the owner's account page. */
export async function listOwnConfigs (db: Db, userId: string): Promise<ConfigListItem[]> {
  const rows = await db
    .select(listCols)
    .from(serverConfig)
    .where(eq(serverConfig.userId, userId))
    .orderBy(desc(serverConfig.createdAt), sql`server_config.rowid desc`)
    .limit(50)
  return hydrateList(db, rows)
}

export async function getConfigDetail (db: Db, slug: string, viewerId: string | null): Promise<ConfigDetail | null> {
  const rows = await db
    .select({ ...listCols, visibility: serverConfig.visibility, forkedFromId: serverConfig.forkedFromId, config: serverConfig.config })
    .from(serverConfig)
    .where(eq(serverConfig.slug, slug))
    .limit(1)
  const row = rows[0]
  if (!row) return null

  const [item] = await hydrateList(db, [row])
  const parsed = serverConfigSchema.safeParse(JSON.parse(row.config))
  const config = parsed.success ? parsed.data : defaultServerConfig()

  let forkedFrom: { slug: string, title: string } | null = null
  if (row.forkedFromId) {
    const src = await db
      .select({ slug: serverConfig.slug, title: serverConfig.title })
      .from(serverConfig)
      .where(eq(serverConfig.id, row.forkedFromId))
      .limit(1)
    forkedFrom = src[0] ?? null
  }

  let likedByViewer = false
  if (viewerId) {
    const liked = await db
      .select({ userId: like.userId })
      .from(like)
      .where(and(eq(like.userId, viewerId), eq(like.configId, row.id)))
      .limit(1)
    likedByViewer = liked.length > 0
  }

  return {
    ...item,
    id: row.id,
    visibility: row.visibility,
    config,
    forkedFrom,
    likedByViewer,
    isOwner: viewerId != null && viewerId === row.userId,
  }
}

export async function incrementView (db: Db, id: string): Promise<void> {
  await db
    .update(serverConfig)
    .set({ viewCount: sql`${serverConfig.viewCount} + 1` })
    .where(eq(serverConfig.id, id))
}

export async function toggleLike (
  db: Db,
  userId: string,
  slug: string
): Promise<{ liked: boolean, likeCount: number } | null> {
  const rows = await db.select({ id: serverConfig.id }).from(serverConfig).where(eq(serverConfig.slug, slug)).limit(1)
  const cfg = rows[0]
  if (!cfg) return null

  const existing = await db
    .select({ userId: like.userId })
    .from(like)
    .where(and(eq(like.userId, userId), eq(like.configId, cfg.id)))
    .limit(1)

  let liked: boolean
  if (existing.length > 0) {
    await db.delete(like).where(and(eq(like.userId, userId), eq(like.configId, cfg.id)))
    await db
      .update(serverConfig)
      .set({ likeCount: sql`max(${serverConfig.likeCount} - 1, 0)` })
      .where(eq(serverConfig.id, cfg.id))
    liked = false
  } else {
    await db.insert(like).values({ userId, configId: cfg.id })
    await db
      .update(serverConfig)
      .set({ likeCount: sql`${serverConfig.likeCount} + 1` })
      .where(eq(serverConfig.id, cfg.id))
    liked = true
  }

  const updated = await db
    .select({ likeCount: serverConfig.likeCount })
    .from(serverConfig)
    .where(eq(serverConfig.id, cfg.id))
    .limit(1)
  return { liked, likeCount: updated[0]?.likeCount ?? 0 }
}

export async function listTags (db: Db, limit = 20): Promise<TagFacet[]> {
  const rows = await db.all<Record<string, unknown>>(sql`
    SELECT t.slug AS slug, t.name AS name, count(ct.config_id) AS count
    FROM tag t
    JOIN config_tag ct ON ct.tag_id = t.id
    JOIN server_config s ON s.id = ct.config_id AND s.visibility = 'public'
    GROUP BY t.id
    ORDER BY count DESC, t.name ASC
    LIMIT ${limit}
  `)
  return rows.map((r) => ({ slug: String(r.slug), name: String(r.name), count: Number(r.count) }))
}
