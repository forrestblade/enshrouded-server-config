import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { ResultAsync } from 'neverthrow'
import { buildCms } from '@valencets/cms'
import { createPool } from '@valencets/db'
import argon2 from 'argon2'
import { createIngestionHandler } from '@valencets/telemetry'
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
const PAGES: Record<string, string> = {
  '/': join(rootDir, 'src/pages/home/ui/index.html'),
  '/config/new': join(rootDir, 'src/pages/config/ui/new.html'),
  '/login': join(rootDir, 'src/pages/auth/ui/login.html'),
  '/signup': join(rootDir, 'src/pages/auth/ui/signup.html'),
  '/account': join(rootDir, 'src/pages/account/ui/index.html'),
  '/browse': join(rootDir, 'src/pages/browse/ui/index.html')
}
const PATTERN_PAGES = [
  { pattern: '/config/:id', file: join(rootDir, 'src/pages/config/ui/editor.html') },
  { pattern: '/browse/:id', file: join(rootDir, 'src/pages/browse/ui/detail.html') }
]

function serveFile (res: ServerResponse, filePath: string): void {
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
    return
  }
  const ext = extname(filePath)
  const mime = MIME_TYPES[ext] ?? 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': mime })
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
function parseBody (req: IncomingMessage): ResultAsync<Record<string, unknown>, Error> {
  return ResultAsync.fromPromise(
    new Promise<Record<string, unknown>>((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
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
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
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
    return rows[0] as Record<string, unknown>
  } catch { return null }
}

// ── Custom routes ─────────────────────────────────────────
// ── Telemetry ─────────────────────────────────────────────
const telemetryHandler = config.telemetry?.enabled
  ? createIngestionHandler({ pool })
  : null

const CUSTOM_API: Record<string, (req: IncomingMessage, res: ServerResponse) => Promise<void>> = {
  'POST /api/telemetry': async (req, res) => {
    if (telemetryHandler) { await telemetryHandler(req, res); return }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, ingested: 0 }))
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

    const { username, avatarUrl } = bodyResult.value as { username?: string, avatarUrl?: string }
    const updates: Record<string, unknown> = {}
    if (username !== undefined) updates.username = username
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl

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

    sendJson(res, 200, updateResult.value)
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
      'Set-Cookie': 'cms_session=; Path=/; HttpOnly; Max-Age=0'
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
          owner: user.id
        }
      })

      if (createResult.isErr()) {
        sendJson(res, 400, { error: createResult.error.message })
        return
      }

      sendJson(res, 201, createResult.value)
    }
  }
]

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
      sendJson(res, 500, { error: 'Internal server error' })
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
      sendJson(res, 500, { error: 'Internal server error' })
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
        res.writeHead(302, { Location: '/admin/login' })
        res.end()
        return
      }
      // Only admin role can access admin panel
      if (user.role !== 'admin') {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<h1>403</h1><p>Admin access required</p>')
        return
      }
    }
    const handler = adminMatch.entry[method]
    if (handler) { await handler(req, res, adminMatch.params); return }
  }

  // 4. REST API routes
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
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end('<h1>404</h1><p>Not found</p>')
})

server.listen(port, () => {
  console.log(`\n  Enshrouded Server Config running.\n`)
  console.log(`  Site:  http://localhost:${port}`)
  console.log(`  Admin: http://localhost:${port}/admin`)
  console.log(`\n  Press Ctrl+C to stop.\n`)
})
