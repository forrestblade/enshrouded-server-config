import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ResultAsync } from 'neverthrow'
import { buildCms } from '@valencets/cms'
import type { CmsConfig } from '@valencets/cms'
import { createPool } from '@valencets/db'
import argon2 from 'argon2'
import {
  createServerRouter,
  createAuthGuard,
  createRateLimitMiddleware,
  serveStaticFile,
  resolveStaticPath,
  resolveMimeType,
  sendJson,
  sendHtml,
  readBody
} from '@valencets/core/server'
import type { RequestContext, Middleware } from '@valencets/core/server'
import { createIngestionHandler, createServerEventLogger } from '@valencets/telemetry'
import configResult from './valence.config.js'

// ── Types ─────────────────────────────────────────────────
interface SessionUser {
  readonly id: string
  readonly username: string
  readonly email: string
  readonly role: string
  readonly avatarUrl: string | null
  readonly bio: string | null
  readonly password_hash: string
  readonly created_at: string
  readonly deleted_at: string | null
}

interface SitemapRow {
  readonly id: string
  readonly updated_at: string | null
}

interface UsernameRow {
  readonly username: string
}

interface LikeRow {
  readonly id: string
  readonly configId: string
}

// ── Resolve config ────────────────────────────────────────
if (configResult.isErr()) {
  console.error('Config error:', configResult.error.message)
  process.exit(1)
}
const config = configResult.value

// ── Database ──────────────────────────────────────────────
const pool = createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  username: config.db.username,
  password: config.db.password,
  max: config.db.max,
  idle_timeout: config.db.idle_timeout,
  connect_timeout: config.db.connect_timeout
})

// ── Server-side event logging (framework) ─────────────────
const serverLog = createServerEventLogger(pool)

// ── CMS ───────────────────────────────────────────────────
const cmsResult = buildCms({
  db: pool,
  secret: process.env.CMS_SECRET ?? 'change-me',
  uploadDir: './uploads',
  collections: config.collections,
  telemetryPool: config.telemetry?.enabled ? pool : undefined
} as CmsConfig)

if (cmsResult.isErr()) {
  console.error('CMS init failed:', cmsResult.error.message)
  process.exit(1)
}

const cms = cmsResult.value

// ── Paths ─────────────────────────────────────────────────
const rootDir = import.meta.dirname
const publicDir = join(rootDir, 'public')
const ERROR_404_HTML = readFileSync(join(rootDir, 'src/pages/error/ui/404.html'), 'utf-8')
const ERROR_500_HTML = readFileSync(join(rootDir, 'src/pages/error/ui/500.html'), 'utf-8')

// ── Auth helpers ──────────────────────────────────────────
function getSessionUser (req: IncomingMessage): ResultAsync<SessionUser | null, Error> {
  const cookieHeader = req.headers.cookie ?? ''
  const sessionMatch = cookieHeader.match(/cms_session=([^;]+)/)
  if (!sessionMatch) return ResultAsync.fromSafePromise(Promise.resolve(null))

  const sessionId = sessionMatch[1]!
  return ResultAsync.fromPromise(
    pool.sql.unsafe<SessionUser[]>(
      `SELECT u.* FROM "cms_sessions" s
       JOIN "users" u ON u.id = s.user_id
       WHERE s.id = $1 AND s.expires_at > NOW() AND s.deleted_at IS NULL AND u.deleted_at IS NULL`,
      [sessionId]
    ),
    (err) => err instanceof Error ? err : new Error(String(err))
  ).map((rows) => {
    if (!rows || rows.length === 0) return null
    pool.sql.unsafe(
      "UPDATE cms_sessions SET expires_at = NOW() + INTERVAL '24 hours' WHERE id = $1",
      [sessionId]
    ).catch(() => {})
    return rows[0] ?? null
  }).orElse(() => ResultAsync.fromSafePromise(Promise.resolve(null)))
}

async function resolveSessionUser (req: IncomingMessage): Promise<SessionUser | null> {
  const result = await getSessionUser(req)
  return result.match((user) => user, () => null)
}

// ── Middleware ─────────────────────────────────────────────
const validateAuth = async (req: IncomingMessage) => {
  const user = await resolveSessionUser(req)
  if (!user) return { authenticated: false as const }
  return { authenticated: true as const, user: { id: user.id, role: user.role ?? 'user' } }
}

const requireAuth = createAuthGuard({ validate: validateAuth, redirectTo: '/login' })
const requireAdmin = createAuthGuard({ validate: validateAuth, redirectTo: '/admin/login', role: 'admin' })
const authRateLimit = createRateLimitMiddleware({ maxRequests: 10, windowMs: 60_000, trustProxy: true })
const apiRateLimit = createRateLimitMiddleware({ maxRequests: 30, windowMs: 60_000, trustProxy: true })

// ── Body parsing helper ───────────────────────────────────
function parseBody (req: IncomingMessage): ResultAsync<Record<string, string | number | boolean | null>, Error> {
  return ResultAsync.fromPromise(
    readBody(req).then(body => JSON.parse(body) as Record<string, string | number | boolean | null>),
    (err) => err instanceof Error ? err : new Error(String(err))
  )
}

// ── Telemetry ingestion (framework) ───────────────────────
const telemetryHandler = createIngestionHandler({ pool })

// ── Router ────────────────────────────────────────────────
const router = createServerRouter()

// ── Static files ──────────────────────────────────────────
router.register('/public/*', {
  GET: async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    const pathResult = resolveStaticPath(url.pathname.replace(/^\/public/, ''), publicDir)
    if (pathResult.isErr()) { sendHtml(res, ERROR_404_HTML, 404); return }
    const mime = resolveMimeType(pathResult.value)
    await serveStaticFile(pathResult.value, mime, req.headers.range, res)
  }
})

const serveStaticMiddleware: Middleware = (req, res, _ctx, next) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const pathname = url.pathname
  const isStaticPath = req.method === 'GET' && (
    pathname.startsWith('/css/') || pathname.startsWith('/js/') ||
    pathname.startsWith('/favicon') || pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') || pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') || pathname.endsWith('.webp') ||
    pathname.endsWith('.webmanifest')
  )
  if (isStaticPath) {
    const pathResult = resolveStaticPath(pathname, publicDir)
    if (pathResult.isOk()) {
      return serveStaticFile(pathResult.value, resolveMimeType(pathResult.value), req.headers.range, res)
    }
  }
  return next()
}
router.use(serveStaticMiddleware)

// ── Sitemap ───────────────────────────────────────────────
router.register('/sitemap.xml', {
  GET: async (_req, res) => {
    const configs = await pool.sql.unsafe<SitemapRow[]>(
      'SELECT id, updated_at FROM "server-configs" WHERE shared = true AND deleted_at IS NULL ORDER BY updated_at DESC'
    )
    const users = await pool.sql.unsafe<UsernameRow[]>(
      'SELECT username FROM users WHERE deleted_at IS NULL'
    )
    const B = 'https://enshroudedserverconfig.com'
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      `  <url><loc>${B}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
      `  <url><loc>${B}/browse</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
      `  <url><loc>${B}/signup</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
      `  <url><loc>${B}/login</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>`,
    ]
    for (const c of configs) {
      const d = c.updated_at ? new Date(c.updated_at).toISOString().split('T')[0] : ''
      lines.push(`  <url><loc>${B}/browse/${c.id}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.7</priority></url>`)
    }
    for (const u of users) {
      lines.push(`  <url><loc>${B}/users/${encodeURIComponent(u.username)}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>`)
    }
    lines.push('</urlset>')
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' })
    res.end(lines.join('\n'))
  }
})

// ── API: Auth ─────────────────────────────────────────────
router.register('/api/users/me', {
  GET: async (req, res) => {
    const user = await resolveSessionUser(req)
    if (!user) { sendJson(res, { error: 'Not authenticated' }, 401); return }
    const { password_hash: _, ...safe } = user
    sendJson(res, safe)
  }
})

router.register('/api/users/me/configs', {
  GET: async (req, res) => {
    const user = await resolveSessionUser(req)
    if (!user) { sendJson(res, { error: 'Not authenticated' }, 401); return }
    const rows = await pool.sql.unsafe(
      `SELECT id, name, slug, "gameSettingsPreset", "forkCount", "likeCount", tags, shared, status, updated_at, server
       FROM "server-configs" WHERE owner = $1 AND deleted_at IS NULL ORDER BY updated_at DESC`,
      [user.id]
    )
    sendJson(res, rows)
  }
}, { middleware: [requireAuth] })

router.register('/api/users/register', {
  POST: async (req, res) => {
    const bodyResult = await parseBody(req)
    if (bodyResult.isErr()) { sendJson(res, { error: 'Invalid JSON body' }, 400); return }
    const { username, email, password } = bodyResult.value as { username?: string, email?: string, password?: string }

    if (!username || !email || !password) { sendJson(res, { error: 'Username, email, and password are required' }, 400); return }
    if (typeof username !== 'string' || username.length < 1 || username.length > 64) { sendJson(res, { error: 'Username must be between 1 and 64 characters' }, 400); return }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) { sendJson(res, { error: 'Username may only contain letters, numbers, hyphens, and underscores' }, 400); return }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { sendJson(res, { error: 'Invalid email format' }, 400); return }
    if (email.length > 254) { sendJson(res, { error: 'Email address is too long' }, 400); return }
    if (password.length < 8) { sendJson(res, { error: 'Password must be at least 8 characters' }, 400); return }

    const hashResult = await ResultAsync.fromPromise(
      argon2.hash(password),
      (err) => err instanceof Error ? err : new Error(String(err))
    )
    if (hashResult.isErr()) { sendJson(res, { error: 'Failed to hash password' }, 500); return }

    const createResult = await cms.api.create({
      collection: 'users',
      data: { username, email, password_hash: hashResult.value, role: 'user' }
    })
    if (createResult.isErr()) { sendJson(res, { error: createResult.error.message }, 400); return }

    const created = createResult.value
    serverLog.log('ACCOUNT', 'auth.register', { userId: String(created.id), email: String(created.email) })
    sendJson(res, { id: created.id, username: String(created.username), email: String(created.email) }, 201)
  }
}, { middleware: [authRateLimit.middleware] })

// ── API: Account ──────────────────────────────────────────
router.register('/api/account', {
  PATCH: async (req, res) => {
    const user = await resolveSessionUser(req)
    if (!user) { sendJson(res, { error: 'Not authenticated' }, 401); return }
    const bodyResult = await parseBody(req)
    if (bodyResult.isErr()) { sendJson(res, { error: 'Invalid JSON body' }, 400); return }

    const body = bodyResult.value
    const username = body.username as string | undefined
    const avatarUrl = body.avatarUrl as string | undefined
    const bio = body.bio as string | undefined
    const updates: Record<string, string | number | boolean | null> = {}

    if (username !== undefined) {
      if (typeof username !== 'string' || username.length < 1 || username.length > 64) { sendJson(res, { error: 'Username must be between 1 and 64 characters' }, 400); return }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) { sendJson(res, { error: 'Username may only contain letters, numbers, hyphens, and underscores' }, 400); return }
      updates.username = username
    }
    if (avatarUrl !== undefined) {
      if (typeof avatarUrl !== 'string' || avatarUrl.length > 2048) { sendJson(res, { error: 'Invalid avatar URL' }, 400); return }
      if (avatarUrl !== '' && !/^https?:\/\/.+/.test(avatarUrl)) { sendJson(res, { error: 'Avatar URL must be a valid HTTP(S) URL' }, 400); return }
      updates.avatarUrl = avatarUrl
    }
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 500) { sendJson(res, { error: 'Bio must be 500 characters or fewer' }, 400); return }
      updates.bio = bio
    }
    if (Object.keys(updates).length === 0) { sendJson(res, { error: 'No fields to update' }, 400); return }

    const updateResult = await cms.api.update({ collection: 'users', id: user.id, data: updates })
    if (updateResult.isErr()) { sendJson(res, { error: updateResult.error.message }, 400); return }

    const { password_hash: _, ...safeUser } = updateResult.value as unknown as SessionUser
    sendJson(res, safeUser)
  },

  DELETE: async (req, res) => {
    const user = await resolveSessionUser(req)
    if (!user) { sendJson(res, { error: 'Not authenticated' }, 401); return }

    await pool.sql.unsafe(`UPDATE "server-configs" SET "owner" = NULL WHERE "owner" = $1`, [user.id])
    await pool.sql.unsafe(`UPDATE "users" SET "deleted_at" = NOW() WHERE "id" = $1`, [user.id])
    await pool.sql.unsafe(`UPDATE "cms_sessions" SET "deleted_at" = NOW() WHERE "user_id" = $1`, [user.id])
    serverLog.log('ACCOUNT', 'account.delete', { userId: user.id })

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': 'cms_session=; Path=/; HttpOnly; Max-Age=0'
    })
    res.end(JSON.stringify({ ok: true }))
  }
}, { middleware: [requireAuth] })

// ── API: Tags ─────────────────────────────────────────────
router.register('/api/tags', {
  GET: async (_req, res) => {
    const rows = await pool.sql.unsafe(`SELECT * FROM tags ORDER BY "usageCount" DESC, name ASC`)
    sendJson(res, rows)
  },

  POST: async (req, res) => {
    const user = await resolveSessionUser(req)
    if (!user) { sendJson(res, { error: 'Not authenticated' }, 401); return }
    const bodyResult = await parseBody(req)
    if (bodyResult.isErr()) { sendJson(res, { error: 'Invalid JSON body' }, 400); return }

    const name = bodyResult.value.name
    if (!name || typeof name !== 'string' || !name.trim()) { sendJson(res, { error: 'Tag name is required' }, 400); return }
    if (name.trim().length > 64) { sendJson(res, { error: 'Tag name must be 64 characters or fewer' }, 400); return }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const existing = await ResultAsync.fromPromise(
      pool.sql.unsafe<Array<{ id: string; name: string; slug: string }>>(`SELECT * FROM tags WHERE slug = $1`, [slug]),
      (err) => err instanceof Error ? err : new Error(String(err))
    )
    if (existing.isOk() && existing.value.length > 0) { sendJson(res, existing.value[0]); return }

    const insertResult = await ResultAsync.fromPromise(
      pool.sql.unsafe<Array<{ id: string; name: string; slug: string }>>(
        `INSERT INTO tags (id, name, slug) VALUES (gen_random_uuid(), $1, $2) RETURNING *`,
        [name.trim(), slug]
      ),
      (err) => err instanceof Error ? err : new Error(String(err))
    )
    if (insertResult.isErr()) { sendJson(res, { error: 'Failed to create tag' }, 400); return }
    sendJson(res, insertResult.value[0], 201)
  }
}, { middleware: [apiRateLimit.middleware] })

// ── API: Likes ────────────────────────────────────────────
router.register('/api/likes/mine', {
  GET: async (req, res) => {
    const user = await resolveSessionUser(req)
    if (!user) { sendJson(res, { error: 'Not authenticated' }, 401); return }
    const rows = await pool.sql.unsafe<LikeRow[]>(`SELECT "configId" FROM likes WHERE "userId" = $1`, [user.id])
    sendJson(res, rows.map((r) => r.configId))
  }
}, { middleware: [requireAuth] })

// ── API: Config actions ───────────────────────────────────
router.register('/api/server-configs/:id/delete', {
  POST: async (req, res, ctx) => {
    const user = await resolveSessionUser(req)
    if (!user) { sendJson(res, { error: 'Not authenticated' }, 401); return }
    const configId = ctx.params.id ?? ''

    const ownerCheck = await pool.sql.unsafe<Array<{ id: string; owner: string | null }>>(
      `SELECT id, owner FROM "server-configs" WHERE id = $1 AND deleted_at IS NULL`, [configId]
    )
    if (ownerCheck.length === 0) { sendJson(res, { error: 'Config not found' }, 404); return }
    if (ownerCheck[0]!.owner !== user.id) { sendJson(res, { error: 'Not authorized to delete this config' }, 403); return }

    const deleteResult = await cms.api.delete({ collection: 'server-configs', id: configId })
    if (deleteResult.isErr()) { sendJson(res, { error: deleteResult.error.message }, 400); return }

    serverLog.log('CONFIG', 'config.delete', { configId, userId: user.id })
    sendJson(res, { ok: true })
  }
}, { middleware: [requireAuth] })

router.register('/api/server-configs/:id/clone', {
  POST: async (req, res, ctx) => {
    const user = await resolveSessionUser(req)
    if (!user) { sendJson(res, { error: 'Not authenticated' }, 401); return }
    const configId = ctx.params.id ?? ''

    const sourceResult = await cms.api.findByID({ collection: 'server-configs', id: configId })
    if (sourceResult.isErr()) { sendJson(res, { error: 'Config not found' }, 404); return }
    const source = sourceResult.value
    if (!source) { sendJson(res, { error: 'Config not found' }, 404); return }

    const createResult = await cms.api.create({
      collection: 'server-configs',
      data: {
        name: String(source.name ?? 'Untitled') + ' (Copy)',
        slug: String(source.slug ?? 'copy') + '-' + Date.now(),
        server: source.server ?? null,
        gameSettingsPreset: source.gameSettingsPreset ?? null,
        gameSettings: source.gameSettings ?? null,
        userGroups: source.userGroups ?? null,
        owner: user.id,
        forkedFrom: configId as string | null
      }
    })
    if (createResult.isErr()) { sendJson(res, { error: createResult.error.message }, 400); return }

    await pool.sql.unsafe(
      `UPDATE "server-configs" SET "forkCount" = COALESCE("forkCount", 0) + 1 WHERE id = $1`, [configId]
    )
    serverLog.log('CONFIG', 'config.clone', { sourceId: configId, newId: String(createResult.value.id ?? '') })
    sendJson(res, createResult.value, 201)
  }
}, { middleware: [requireAuth, apiRateLimit.middleware] })

router.register('/api/server-configs/:id/like', {
  POST: async (req, res, ctx) => {
    const user = await resolveSessionUser(req)
    if (!user) { sendJson(res, { error: 'Not authenticated' }, 401); return }
    const configId = ctx.params.id ?? ''

    const existing = await pool.sql.unsafe<LikeRow[]>(
      `SELECT id FROM likes WHERE "userId" = $1 AND "configId" = $2`, [user.id, configId]
    )
    if (existing.length > 0) {
      await pool.sql.unsafe(`DELETE FROM likes WHERE id = $1`, [existing[0]!.id])
      await pool.sql.unsafe(`UPDATE "server-configs" SET "likeCount" = GREATEST(COALESCE("likeCount", 0) - 1, 0) WHERE id = $1`, [configId])
      serverLog.log('ENGAGEMENT', 'config.like', { configId, liked: 'false' })
      sendJson(res, { liked: false })
    } else {
      await pool.sql.unsafe(`INSERT INTO likes (id, "userId", "configId") VALUES (gen_random_uuid(), $1, $2)`, [user.id, configId])
      await pool.sql.unsafe(`UPDATE "server-configs" SET "likeCount" = COALESCE("likeCount", 0) + 1 WHERE id = $1`, [configId])
      serverLog.log('ENGAGEMENT', 'config.like', { configId, liked: 'true' })
      sendJson(res, { liked: true })
    }
  }
}, { middleware: [requireAuth, apiRateLimit.middleware] })

router.register('/api/server-configs/:id/liked', {
  GET: async (req, res, ctx) => {
    const user = await resolveSessionUser(req)
    if (!user) { sendJson(res, { liked: false }); return }
    const configId = ctx.params.id ?? ''
    const rows = await pool.sql.unsafe<LikeRow[]>(
      `SELECT id FROM likes WHERE "userId" = $1 AND "configId" = $2`, [user.id, configId]
    )
    sendJson(res, { liked: rows.length > 0 })
  }
})

// ── API: User profiles ────────────────────────────────────
router.register('/api/users/profile/:username', {
  GET: async (_req, res, ctx) => {
    const username = ctx.params.username ?? ''
    const rows = await pool.sql.unsafe<Array<{ id: string; username: string; avatarUrl: string | null; bio: string | null; created_at: string }>>(
      `SELECT id, username, "avatarUrl", bio, created_at FROM users WHERE username = $1 AND deleted_at IS NULL`, [username]
    )
    if (rows.length === 0) { sendJson(res, { error: 'User not found' }, 404); return }
    const user = rows[0]!
    const configs = await pool.sql.unsafe(
      `SELECT id, name, slug, "gameSettingsPreset", "forkCount", "likeCount", tags, updated_at, server
       FROM "server-configs" WHERE owner = $1 AND shared = true AND deleted_at IS NULL ORDER BY updated_at DESC`,
      [user.id]
    )
    sendJson(res, { ...user, configs })
  }
})

// ── Telemetry ingestion ───────────────────────────────────
router.register('/api/telemetry', {
  POST: async (req, res) => { await telemetryHandler(req, res) }
}, { middleware: [apiRateLimit.middleware] })

// ── CMS admin + REST routes ───────────────────────────────
for (const [path, entry] of cms.adminRoutes) {
  const isPublic = path === '/admin/login' || path === '/admin/logout' || path.startsWith('/admin/_assets/')
  router.register(path, entry as Record<string, Function>, isPublic ? undefined : { middleware: [requireAdmin] })
}
for (const [path, entry] of cms.restRoutes) {
  router.register(path, entry as Record<string, Function>, { middleware: [requireAuth] })
}

// ── Page routes ───────────────────────────────────────────
function servePage (filePath: string) {
  return async (_req: IncomingMessage, res: ServerResponse) => {
    sendHtml(res, readFileSync(filePath, 'utf-8'))
  }
}

const publicPages: Record<string, string> = {
  '/': join(rootDir, 'src/pages/home/ui/index.html'),
  '/config/new': join(rootDir, 'src/pages/config/ui/new.html'),
  '/login': join(rootDir, 'src/pages/auth/ui/login.html'),
  '/signup': join(rootDir, 'src/pages/auth/ui/signup.html'),
  '/browse': join(rootDir, 'src/pages/browse/ui/index.html')
}
const authPages: Record<string, string> = {
  '/account': join(rootDir, 'src/pages/account/ui/index.html'),
  '/my-configs': join(rootDir, 'src/pages/my-configs/ui/index.html')
}

for (const [path, file] of Object.entries(publicPages)) {
  router.register(path, { GET: servePage(file) })
}
for (const [path, file] of Object.entries(authPages)) {
  router.register(path, { GET: servePage(file) }, { middleware: [requireAuth] })
}

router.register('/config/:id', { GET: servePage(join(rootDir, 'src/pages/config/ui/editor.html')) })
router.register('/browse/:id', { GET: servePage(join(rootDir, 'src/pages/browse/ui/detail.html')) })
router.register('/users/:username', { GET: servePage(join(rootDir, 'src/pages/users/ui/profile.html')) })

// ── 404 fallback ──────────────────────────────────────────
router.register('/404', { GET: async (_req, res) => { sendHtml(res, ERROR_404_HTML, 404) } })

// ── Error handler ─────────────────────────────────────────
router.onError(async (error, _req, res) => {
  console.error('[server] unhandled error:', error.message)
  if (!res.headersSent) { sendHtml(res, ERROR_500_HTML, 500) }
})

// ── HTTP Server ───────────────────────────────────────────
const port = config.server.port
const server = createServer((req, res) => router.handle(req, res))

server.listen(port, () => {
  console.log(`\n  Enshrouded Server Config running.\n`)
  console.log(`  Site:  http://localhost:${port}`)
  console.log(`  Admin: http://localhost:${port}/admin`)
  console.log(`\n  Press Ctrl+C to stop.\n`)
})
