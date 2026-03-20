import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import crypto from 'node:crypto'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { ResultAsync } from 'neverthrow'
import { buildCms } from '@valencets/cms'
import { createPool } from '@valencets/db'
import argon2 from 'argon2'
import { startTelemetryScheduler } from '@valencets/cms'
// Telemetry ingestion handler (inline to avoid @valencets/core DOMParser issue in Node)
import configResult from './valence.config.js'

// ── Resolve config ────────────────────────────────────────
if (configResult.isErr()) {
  console.error('Config error:', configResult.error.message)
  process.exit(1)
}
const config = configResult.value

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

// ── Security headers ─────────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

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

// ── CMS ───────────────────────────────────────────────────
const cmsResult = buildCms({
  db: pool,
  secret: process.env.CMS_SECRET ?? 'change-me',
  uploadDir: './uploads',
  collections: config.collections as any,
  telemetryPool: config.telemetry?.enabled ? pool : undefined
})

if (cmsResult.isErr()) {
  console.error('CMS init failed:', cmsResult.error.message)
  process.exit(1)
}

const cms = cmsResult.value

// Start telemetry aggregation (runs every 15 minutes)
if (config.telemetry?.enabled) {
  startTelemetryScheduler(pool, config.telemetry.siteId ?? 'default', 15 * 60_000)
  console.log('  Telemetry scheduler started (15 min interval)')
}

// ── Route matching ────────────────────────────────────────
function matchRoute (pathname: string, routes: Map<string, unknown>): { entry: any, params: Record<string, string> } | null {
  const exact = routes.get(pathname)
  if (exact) return { entry: exact, params: {} }

  for (const [pattern, entry] of routes) {
    if (!pattern.includes(':')) continue
    const pp = pattern.split('/')
    const up = pathname.split('/')
    if (pp.length !== up.length) continue
    const params: Record<string, string> = {}
    let match = true
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = up[i]
      else if (pp[i] !== up[i]) { match = false; break }
    }
    if (match) return { entry, params }
  }
  return null
}

// ── Page routes ───────────────────────────────────────────
const rootDir = import.meta.dirname

// ── Error pages ───────────────────────────────────────────
const ERROR_404_HTML = readFileSync(join(rootDir, 'src/pages/error/ui/404.html'), 'utf-8')
const ERROR_500_HTML = readFileSync(join(rootDir, 'src/pages/error/ui/500.html'), 'utf-8')

const PAGES: Record<string, string> = {
  '/analytics': join(rootDir, 'src/pages/analytics/ui/index.html'),
  '/': join(rootDir, 'src/pages/home/ui/index.html'),
  '/config/new': join(rootDir, 'src/pages/config/ui/new.html'),
  '/login': join(rootDir, 'src/pages/auth/ui/login.html'),
  '/signup': join(rootDir, 'src/pages/auth/ui/signup.html'),
  '/account': join(rootDir, 'src/pages/account/ui/index.html'),
  '/browse': join(rootDir, 'src/pages/browse/ui/index.html')
}
const PATTERN_PAGES = [
  { pattern: '/config/:id', file: join(rootDir, 'src/pages/config/ui/editor.html') },
  { pattern: '/browse/:id', file: join(rootDir, 'src/pages/browse/ui/detail.html') },
  { pattern: '/users/:username', file: join(rootDir, 'src/pages/users/ui/profile.html') }
]

function serveFile (res: ServerResponse, filePath: string): void {
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS })
    res.end(ERROR_404_HTML)
    return
  }
  const ext = extname(filePath)
  const mime = MIME_TYPES[ext] ?? 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': mime, ...SECURITY_HEADERS })
  res.end(readFileSync(filePath))
}

function serveStatic (pathname: string, res: ServerResponse): boolean {
  const filePath = join(rootDir, 'public', pathname)
  if (!existsSync(filePath)) return false
  const stat = statSync(filePath)
  if (!stat.isFile()) return false
  serveFile(res, filePath)
  return true
}

function matchPagePattern (pathname: string): string | null {
  for (const { pattern, file } of PATTERN_PAGES) {
    const pp = pattern.split('/')
    const up = pathname.split('/')
    if (pp.length !== up.length) continue
    let match = true
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) continue
      if (pp[i] !== up[i]) { match = false; break }
    }
    if (match) return file
  }
  return null
}

// ── Helpers ───────────────────────────────────────────────
const MAX_BODY_SIZE = 1024 * 1024 // 1 MB

function parseBody (req: IncomingMessage): ResultAsync<Record<string, unknown>, Error> {
  return ResultAsync.fromPromise(
    new Promise<Record<string, unknown>>((resolve, reject) => {
      const chunks: Buffer[] = []
      let totalSize = 0
      req.on('data', (chunk: Buffer) => {
        totalSize += chunk.length
        if (totalSize > MAX_BODY_SIZE) {
          req.destroy()
          reject(new Error('Request body too large'))
          return
        }
        chunks.push(chunk)
      })
      req.on('end', () => {
        const parsed = JSON.parse(Buffer.concat(chunks).toString())
        resolve(parsed)
      })
      req.on('error', reject)
    }),
    (err) => err instanceof Error ? err : new Error(String(err))
  )
}

function sendJson (res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS })
  res.end(JSON.stringify(data))
}

/** Extract session user from cookie. Returns the user record or null. */
async function getSessionUser (req: IncomingMessage): Promise<Record<string, unknown> | null> {
  const cookieHeader = req.headers.cookie ?? ''
  const sessionMatch = cookieHeader.match(/cms_session=([^;]+)/)
  if (!sessionMatch) return null

  const sessionId = sessionMatch[1]
  try {
    const rows = await pool.sql.unsafe(
      `SELECT u.* FROM "cms_sessions" s
       JOIN "users" u ON u.id = s.user_id
       WHERE s.id = $1 AND s.expires_at > NOW() AND s.deleted_at IS NULL AND u.deleted_at IS NULL`,
      [sessionId]
    )
    if (!rows || rows.length === 0) return null
    // Rolling session — extend expiry on each authenticated request (24 hours)
    pool.sql.unsafe(
      "UPDATE cms_sessions SET expires_at = NOW() + INTERVAL '24 hours' WHERE id = $1",
      [sessionId]
    ).catch(() => {})
    return rows[0] as Record<string, unknown>
  } catch { return null }
}

// ── Custom routes ─────────────────────────────────────────
// RATE LIMITING (handled by nginx in production):
//   - POST /api/users/register  — limit to prevent spam account creation
//   - POST /api/tags            — limit to prevent tag flood
//   - POST /api/server-configs/:id/like — limit to prevent like spam
//   - POST /api/server-configs/:id/clone — limit to prevent clone abuse
//   - POST /api/telemetry       — limit to prevent telemetry flood
const CUSTOM_API: Record<string, (req: IncomingMessage, res: ServerResponse) => Promise<void>> = {
  'GET /sitemap.xml': async (_req, res) => {
    const configs = await pool.sql.unsafe(
      'SELECT id, updated_at FROM "server-configs" WHERE shared = true AND deleted_at IS NULL ORDER BY updated_at DESC'
    )
    const users = await pool.sql.unsafe(
      'SELECT username FROM users WHERE deleted_at IS NULL'
    )
    const B = 'https://enshroudedserverconfig.com'
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url><loc>' + B + '/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>',
      '  <url><loc>' + B + '/browse</loc><changefreq>daily</changefreq><priority>0.9</priority></url>',
      '  <url><loc>' + B + '/signup</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>',
      '  <url><loc>' + B + '/login</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>',
    ]
    for (const c of configs as any[]) {
      const d = c.updated_at ? new Date(c.updated_at).toISOString().split('T')[0] : ''
      lines.push('  <url><loc>' + B + '/browse/' + c.id + '</loc>' + (d ? '<lastmod>' + d + '</lastmod>' : '') + '<changefreq>weekly</changefreq><priority>0.7</priority></url>')
    }
    for (const u of users as any[]) {
      lines.push('  <url><loc>' + B + '/users/' + encodeURIComponent(u.username) + '</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>')
    }
    lines.push('</urlset>')
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', ...SECURITY_HEADERS })
    res.end(lines.join('\n'))
  },

  
  'GET /api/admin/analytics': async (req, res) => {
    const user = await getSessionUser(req)
    if (!user || (user as any).role !== 'admin') { sendJson(res, 403, { error: 'Admin only' }); return }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]

    // Core metrics
    const users = await pool.sql.unsafe('SELECT COUNT(*)::int as c FROM users WHERE deleted_at IS NULL')
    const configs = await pool.sql.unsafe('SELECT COUNT(*)::int as c FROM "server-configs" WHERE deleted_at IS NULL')
    const shared = await pool.sql.unsafe('SELECT COUNT(*)::int as c FROM "server-configs" WHERE shared = true AND deleted_at IS NULL')
    const sessions = await pool.sql.unsafe('SELECT COUNT(*)::int as c FROM sessions WHERE created_at >= $1', [weekAgo])

    // Funnel
    const funnel = await pool.sql.unsafe(`
      SELECT
        (SELECT COUNT(DISTINCT session_id)::int FROM events WHERE dom_target IN ('home.browse', 'home.new-config')) as home_engaged,
        (SELECT COUNT(DISTINCT session_id)::int FROM events WHERE dom_target = 'browse.config-tile') as browsed_configs,
        (SELECT COUNT(DISTINCT session_id)::int FROM events WHERE event_category = 'LEAD_FORM') as attempted_auth,
        (SELECT COUNT(DISTINCT session_id)::int FROM events WHERE dom_target = 'editor.save') as saved_config,
        (SELECT COUNT(DISTINCT session_id)::int FROM events WHERE dom_target = 'editor.export') as exported
    `)

    // Top referrers
    const referrers = await pool.sql.unsafe(`
      SELECT COALESCE(NULLIF(referrer, ''), 'Direct') as source, COUNT(*)::int as count
      FROM sessions WHERE created_at >= $1
      GROUP BY source ORDER BY count DESC LIMIT 10
    `, [weekAgo])

    // Top actions
    const actions = await pool.sql.unsafe(`
      SELECT dom_target as action, COUNT(*)::int as count
      FROM events WHERE created_at >= $1 AND dom_target != ''
      GROUP BY dom_target ORDER BY count DESC LIMIT 15
    `, [weekAgo])

    // Hourly activity (last 24h)
    const hourly = await pool.sql.unsafe(`
      SELECT date_trunc('hour', created_at) as hour, COUNT(*)::int as count
      FROM events WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY hour ORDER BY hour
    `)

    // Daily sessions (last 7 days)
    const daily = await pool.sql.unsafe(`
      SELECT date_trunc('day', created_at)::date as day, COUNT(*)::int as count
      FROM sessions WHERE created_at >= $1
      GROUP BY day ORDER BY day
    `, [weekAgo])

    // Recent configs
    const recentConfigs = await pool.sql.unsafe(`
      SELECT name, slug, "gameSettingsPreset", shared, created_at
      FROM "server-configs" WHERE deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 10
    `)

    sendJson(res, 200, {
      overview: {
        totalUsers: (users[0] as any)?.c ?? 0,
        totalConfigs: (configs[0] as any)?.c ?? 0,
        sharedConfigs: (shared[0] as any)?.c ?? 0,
        weekSessions: (sessions[0] as any)?.c ?? 0,
      },
      funnel: funnel[0] ?? {},
      referrers,
      actions,
      hourly,
      daily,
      recentConfigs,
    })
  },

  'GET /api/users/me': async (req, res) => {
    const user = await getSessionUser(req)
    if (!user) { sendJson(res, 401, { error: 'Not authenticated' }); return }
    const { password_hash, ...safe } = user as Record<string, unknown>
    sendJson(res, 200, safe)
  },
  'POST /api/telemetry': async (req, res) => {
    const chunks: Buffer[] = []
    let totalSize = 0
    for await (const chunk of req) {
      totalSize += (chunk as Buffer).length
      if (totalSize > MAX_BODY_SIZE) {
        sendJson(res, 413, { error: 'Request body too large' })
        return
      }
      chunks.push(chunk as Buffer)
    }
    const body = Buffer.concat(chunks).toString()
    try {
      const events = JSON.parse(body)
      if (!Array.isArray(events) || events.length === 0) {
        res.writeHead(200, { 'Content-Type': 'application/json', ...SECURITY_HEADERS })
        res.end(JSON.stringify({ ok: true, ingested: 0 }))
        return
      }
      const sessionId = crypto.randomUUID()
      await pool.sql.unsafe(
        'INSERT INTO sessions (session_id, referrer, device_type) VALUES ($1, $2, $3)',
        [sessionId, events[0]?.referrer ?? '', 'beacon']
      )
      for (const ev of events) {
        await pool.sql.unsafe(
          'INSERT INTO events (session_id, event_category, dom_target, payload) VALUES ($1, $2, $3, $4)',
          [sessionId, ev.type ?? '', ev.targetDOMNode ?? '', JSON.stringify(ev)]
        )
      }
      res.writeHead(200, { 'Content-Type': 'application/json', ...SECURITY_HEADERS })
      res.end(JSON.stringify({ ok: true, ingested: events.length }))
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json', ...SECURITY_HEADERS })
      res.end(JSON.stringify({ ok: true, ingested: 0 }))
    }
  },
  'POST /api/users/register': async (req, res) => {
    const bodyResult = await parseBody(req)
    if (bodyResult.isErr()) {
      sendJson(res, 400, { error: 'Invalid JSON body' })
      return
    }
    const { username, email, password } = bodyResult.value as { username?: string, email?: string, password?: string }

    if (!username || !email || !password) {
      sendJson(res, 400, { error: 'Username, email, and password are required' })
      return
    }
    if (typeof username !== 'string' || username.length < 1 || username.length > 64) {
      sendJson(res, 400, { error: 'Username must be between 1 and 64 characters' })
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      sendJson(res, 400, { error: 'Username may only contain letters, numbers, hyphens, and underscores' })
      return
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      sendJson(res, 400, { error: 'Invalid email format' })
      return
    }
    if (email.length > 254) {
      sendJson(res, 400, { error: 'Email address is too long' })
      return
    }
    if (password.length < 8) {
      sendJson(res, 400, { error: 'Password must be at least 8 characters' })
      return
    }

    const hashResult = await ResultAsync.fromPromise(
      argon2.hash(password),
      (err) => err instanceof Error ? err : new Error(String(err))
    )
    if (hashResult.isErr()) {
      sendJson(res, 500, { error: 'Failed to hash password' })
      return
    }

    const createResult = await cms.api.create({
      collection: 'users',
      data: { username, email, password_hash: hashResult.value, role: 'user' }
    })

    if (createResult.isErr()) {
      sendJson(res, 400, { error: createResult.error.message })
      return
    }

    const user = createResult.value as Record<string, unknown>
    sendJson(res, 201, { id: user.id, username: (user as any).username, email: user.email })
  },

  'PATCH /api/account': async (req, res) => {
    const user = await getSessionUser(req)
    if (!user) { sendJson(res, 401, { error: 'Not authenticated' }); return }

    const bodyResult = await parseBody(req)
    if (bodyResult.isErr()) { sendJson(res, 400, { error: 'Invalid JSON body' }); return }

    const { username, avatarUrl, bio } = bodyResult.value as { username?: string, avatarUrl?: string, bio?: string }
    const updates: Record<string, unknown> = {}
    if (username !== undefined) {
      if (typeof username !== 'string' || username.length < 1 || username.length > 64) {
        sendJson(res, 400, { error: 'Username must be between 1 and 64 characters' }); return
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        sendJson(res, 400, { error: 'Username may only contain letters, numbers, hyphens, and underscores' }); return
      }
      updates.username = username
    }
    if (avatarUrl !== undefined) {
      if (typeof avatarUrl !== 'string' || avatarUrl.length > 2048) {
        sendJson(res, 400, { error: 'Invalid avatar URL' }); return
      }
      if (avatarUrl !== '' && !/^https?:\/\/.+/.test(avatarUrl)) {
        sendJson(res, 400, { error: 'Avatar URL must be a valid HTTP(S) URL' }); return
      }
      updates.avatarUrl = avatarUrl
    }
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 500) {
        sendJson(res, 400, { error: 'Bio must be 500 characters or fewer' }); return
      }
      updates.bio = bio
    }

    if (Object.keys(updates).length === 0) {
      sendJson(res, 400, { error: 'No fields to update' })
      return
    }

    const updateResult = await cms.api.update({
      collection: 'users',
      id: user.id as string,
      data: updates
    })

    if (updateResult.isErr()) {
      sendJson(res, 400, { error: updateResult.error.message })
      return
    }

    const { password_hash: _, ...safeUser } = updateResult.value as Record<string, unknown>
    sendJson(res, 200, safeUser)
  },

  'GET /api/tags': async (_req, res) => {
    const rows = await pool.sql.unsafe(
      `SELECT * FROM tags ORDER BY "usageCount" DESC, name ASC`
    )
    sendJson(res, 200, rows)
  },

  'POST /api/tags': async (req, res) => {
    const user = await getSessionUser(req)
    if (!user) { sendJson(res, 401, { error: 'Not authenticated' }); return }

    const bodyResult = await parseBody(req)
    if (bodyResult.isErr()) { sendJson(res, 400, { error: 'Invalid JSON body' }); return }

    const { name } = bodyResult.value as { name?: string }
    if (!name || !name.trim()) { sendJson(res, 400, { error: 'Tag name is required' }); return }
    if (typeof name !== 'string' || name.trim().length > 64) {
      sendJson(res, 400, { error: 'Tag name must be 64 characters or fewer' }); return
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    try {
      const existing = await pool.sql.unsafe(
        `SELECT * FROM tags WHERE slug = $1`, [slug]
      )
      if (existing.length > 0) {
        sendJson(res, 200, existing[0])
        return
      }
      const rows = await pool.sql.unsafe(
        `INSERT INTO tags (id, name, slug) VALUES (gen_random_uuid(), $1, $2) RETURNING *`,
        [name.trim(), slug]
      )
      sendJson(res, 201, rows[0])
    } catch {
      sendJson(res, 400, { error: 'Failed to create tag' })
    }
  },

  'GET /api/likes/mine': async (req, res) => {
    const user = await getSessionUser(req)
    if (!user) { sendJson(res, 401, { error: 'Not authenticated' }); return }

    const rows = await pool.sql.unsafe(
      `SELECT "configId" FROM likes WHERE "userId" = $1`,
      [user.id]
    )
    sendJson(res, 200, rows.map((r: any) => r.configId))
  },

  'DELETE /api/account': async (req, res) => {
    const user = await getSessionUser(req)
    if (!user) { sendJson(res, 401, { error: 'Not authenticated' }); return }

    // Orphan configs owned by this user
    await pool.sql.unsafe(
      `UPDATE "server-configs" SET "owner" = NULL WHERE "owner" = $1`,
      [user.id]
    )

    // Soft-delete the user
    await pool.sql.unsafe(
      `UPDATE "users" SET "deleted_at" = NOW() WHERE "id" = $1`,
      [user.id]
    )

    // Destroy all sessions for this user
    await pool.sql.unsafe(
      `UPDATE "cms_sessions" SET "deleted_at" = NOW() WHERE "user_id" = $1`,
      [user.id]
    )

    // Clear session cookie
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': 'cms_session=; Path=/; HttpOnly; Max-Age=0',
      ...SECURITY_HEADERS
    })
    res.end(JSON.stringify({ ok: true }))
  }
}

// Pattern-based custom API routes (for routes with :params)
type PatternHandler = { pattern: string, method: string, handler: (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => Promise<void> }
const CUSTOM_API_PATTERNS: PatternHandler[] = [
  {
    pattern: '/api/server-configs/:id/clone',
    method: 'POST',
    handler: async (req, res, params) => {
      const user = await getSessionUser(req)
      if (!user) { sendJson(res, 401, { error: 'Not authenticated' }); return }

      const sourceResult = await cms.api.findById({
        collection: 'server-configs',
        id: params.id
      })

      if (sourceResult.isErr()) {
        sendJson(res, 404, { error: 'Config not found' })
        return
      }

      const source = sourceResult.value as Record<string, unknown>
      const cloneName = (source.name as string || 'Untitled') + ' (Copy)'
      const cloneSlug = (source.slug as string || 'copy') + '-' + Date.now()

      const createResult = await cms.api.create({
        collection: 'server-configs',
        data: {
          name: cloneName,
          slug: cloneSlug,
          server: source.server,
          gameSettingsPreset: source.gameSettingsPreset,
          gameSettings: source.gameSettings,
          userGroups: source.userGroups,
          owner: user.id,
          forkedFrom: params.id
        }
      })

      if (createResult.isErr()) {
        sendJson(res, 400, { error: createResult.error.message })
        return
      }

      // Increment fork count on source config
      await pool.sql.unsafe(
        `UPDATE "server-configs" SET "forkCount" = COALESCE("forkCount", 0) + 1 WHERE id = $1`,
        [params.id]
      )

      sendJson(res, 201, createResult.value)
    }
  }
]

// Like toggle
CUSTOM_API_PATTERNS.push({
  pattern: '/api/server-configs/:id/like',
  method: 'POST',
  handler: async (req, res, params) => {
    const user = await getSessionUser(req)
    if (!user) { sendJson(res, 401, { error: 'Not authenticated' }); return }

    const existing = await pool.sql.unsafe(
      `SELECT id FROM likes WHERE "userId" = $1 AND "configId" = $2`,
      [user.id, params.id]
    )

    if (existing.length > 0) {
      // Unlike
      await pool.sql.unsafe(`DELETE FROM likes WHERE id = $1`, [existing[0].id])
      await pool.sql.unsafe(
        `UPDATE "server-configs" SET "likeCount" = GREATEST(COALESCE("likeCount", 0) - 1, 0) WHERE id = $1`,
        [params.id]
      )
      sendJson(res, 200, { liked: false })
    } else {
      // Like
      await pool.sql.unsafe(
        `INSERT INTO likes (id, "userId", "configId") VALUES (gen_random_uuid(), $1, $2)`,
        [user.id, params.id]
      )
      await pool.sql.unsafe(
        `UPDATE "server-configs" SET "likeCount" = COALESCE("likeCount", 0) + 1 WHERE id = $1`,
        [params.id]
      )
      sendJson(res, 200, { liked: true })
    }
  }
})

// Check if user liked a config
CUSTOM_API_PATTERNS.push({
  pattern: '/api/server-configs/:id/liked',
  method: 'GET',
  handler: async (req, res, params) => {
    const user = await getSessionUser(req)
    if (!user) { sendJson(res, 200, { liked: false }); return }

    const rows = await pool.sql.unsafe(
      `SELECT id FROM likes WHERE "userId" = $1 AND "configId" = $2`,
      [user.id, params.id]
    )
    sendJson(res, 200, { liked: rows.length > 0 })
  }
})

// Public user profile API
CUSTOM_API_PATTERNS.push({
  pattern: '/api/users/profile/:username',
  method: 'GET',
  handler: async (_req, res, params) => {
    const rows = await pool.sql.unsafe(
      `SELECT id, username, "avatarUrl", bio, created_at FROM users WHERE username = $1 AND deleted_at IS NULL`,
      [params.username]
    )
    if (rows.length === 0) { sendJson(res, 404, { error: 'User not found' }); return }

    const user = rows[0] as Record<string, unknown>
    const configs = await pool.sql.unsafe(
      `SELECT id, name, slug, "gameSettingsPreset", "forkCount", "likeCount", tags, updated_at, server
       FROM "server-configs"
       WHERE owner = $1 AND shared = true AND deleted_at IS NULL
       ORDER BY updated_at DESC`,
      [user.id]
    )

    sendJson(res, 200, { ...user, configs })
  }
})

function matchCustomPattern (method: string, pathname: string): { handler: PatternHandler['handler'], params: Record<string, string> } | null {
  for (const route of CUSTOM_API_PATTERNS) {
    if (route.method !== method) continue
    const pp = route.pattern.split('/')
    const up = pathname.split('/')
    if (pp.length !== up.length) continue
    const params: Record<string, string> = {}
    let match = true
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = up[i]
      else if (pp[i] !== up[i]) { match = false; break }
    }
    if (match) return { handler: route.handler, params }
  }
  return null
}

// ── HTTP Server ───────────────────────────────────────────
const port = config.server.port
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const method = req.method ?? 'GET'

  // 1. Static files from public/
  if (method === 'GET' && serveStatic(url.pathname, res)) return

  // 2. Custom API routes (before CMS so we can override)
  const customKey = `${method} ${url.pathname}`
  if (CUSTOM_API[customKey]) {
    const result = await ResultAsync.fromPromise(
      CUSTOM_API[customKey](req, res),
      (err) => err instanceof Error ? err : new Error(String(err))
    )
    if (result.isErr() && !res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS })
      res.end(ERROR_500_HTML)
    }
    return
  }

  // 2b. Pattern-based custom API routes
  const customPatternMatch = matchCustomPattern(method, url.pathname)
  if (customPatternMatch) {
    const result = await ResultAsync.fromPromise(
      customPatternMatch.handler(req, res, customPatternMatch.params),
      (err) => err instanceof Error ? err : new Error(String(err))
    )
    if (result.isErr() && !res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS })
      res.end(ERROR_500_HTML)
    }
    return
  }

  // 3. Admin routes (auth-protected except login/logout)
  const adminMatch = matchRoute(url.pathname, cms.adminRoutes as any)
  if (adminMatch) {
    const isPublicAdmin = url.pathname === '/admin/login' || url.pathname === '/admin/logout' || url.pathname.startsWith('/admin/_assets/')
    if (!isPublicAdmin) {
      const user = await getSessionUser(req)
      if (!user) {
        res.writeHead(302, { Location: '/admin/login', ...SECURITY_HEADERS })
        res.end()
        return
      }
      // Only admin role can access admin panel
      if (user.role !== 'admin') {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS })
        res.end(ERROR_404_HTML.replace('404', '403').replace("The page you're looking for doesn't exist.", 'Admin access required.'))
        return
      }
    }
    const handler = adminMatch.entry[method]
    if (handler) { await handler(req, res, adminMatch.params); return }
  }

  // 4. REST API routes (CMS framework handles auth + ownership enforcement
  //    for PATCH/DELETE on collections via its built-in middleware)
  const restMatch = matchRoute(url.pathname, cms.restRoutes as any)
  if (restMatch) {
    const handler = restMatch.entry[method]
    if (handler) { await handler(req, res, restMatch.params); return }
  }

  // 5. Page routes (GET only)
  if (method === 'GET') {
    const exactPage = PAGES[url.pathname]
    if (exactPage) { serveFile(res, exactPage); return }

    const patternPage = matchPagePattern(url.pathname)
    if (patternPage) { serveFile(res, patternPage); return }
  }

  // 6. 404
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS })
  res.end(ERROR_404_HTML)
})

server.listen(port, () => {
  console.log(`\n  Enshrouded Server Config running.\n`)
  console.log(`  Site:  http://localhost:${port}`)
  console.log(`  Admin: http://localhost:${port}/admin`)
  console.log(`\n  Press Ctrl+C to stop.\n`)
})
