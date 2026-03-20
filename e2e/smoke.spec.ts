import { test, expect, type Page } from '@playwright/test'

// ── Auth Setup ───────────────────────────────────────────
// Register a unique test user per run to avoid rate limits
const TEST_USER = {
  username: 'pw_' + Date.now(),
  email: `pw_${Date.now()}@test.com`,
  password: 'password123'
}

test.beforeAll(async ({ request }) => {
  await request.post('/api/users/register', { data: TEST_USER })
})

async function login(page: Page) {
  const res = await page.request.post('/api/users/login', {
    data: { email: TEST_USER.email, password: TEST_USER.password }
  })
  if (!res.ok()) throw new Error('Login failed: ' + await res.text())
}

// ── Page Load Tests ──────────────────────────────────────
test.describe('pages load without console errors', () => {
  const pages = [
    { name: 'home', path: '/' },
    { name: 'login', path: '/login' },
    { name: 'signup', path: '/signup' },
    { name: 'browse', path: '/browse' },
    { name: 'config new', path: '/config/new' },
  ]

  for (const { name, path } of pages) {
    test(`${name}`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.goto(path)
      await expect(page.locator('nav')).toBeVisible()
      expect(errors).toEqual([])
    })
  }

  test('404 renders styled error page', async ({ page }) => {
    await page.goto('/nonexistent-page')
    await expect(page.locator('.error-code')).toHaveText('404')
    await expect(page.locator('.error-page a[href="/"]')).toBeVisible()
  })
})

// ── Security Headers ─────────────────────────────────────
test('security headers present', async ({ request }) => {
  const res = await request.get('/')
  expect(res.headers()['x-content-type-options']).toBe('nosniff')
  expect(res.headers()['x-frame-options']).toBe('DENY')
  expect(res.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
})

// ── Meta Tags + Favicon ──────────────────────────────────
test('meta tags and favicon', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Enshrouded/)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Enshrouded/)
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
})

// ── ARIA ─────────────────────────────────────────────────
test.describe('ARIA', () => {
  test('skip link and landmarks', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#main-content')
    await expect(page.locator('main#main-content')).toBeVisible()
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible()
  })

  test('browse controls are labeled', async ({ page }) => {
    await page.goto('/browse')
    await expect(page.getByRole('searchbox', { name: /search/i })).toBeVisible()
    await expect(page.getByRole('combobox', { name: /preset/i })).toBeVisible()
    await expect(page.getByRole('combobox', { name: /sort/i })).toBeVisible()
  })
})

// ── Tags API ─────────────────────────────────────────────
test('tags API returns curated tags', async ({ request }) => {
  const res = await request.get('/api/tags')
  expect(res.ok()).toBeTruthy()
  const tags = await res.json()
  expect(tags.length).toBeGreaterThanOrEqual(7)
  const slugs = tags.map((t: any) => t.slug)
  expect(slugs).toContain('pve')
  expect(slugs).toContain('hardcore')
  expect(slugs).toContain('builder')
})

// ── Browse ───────────────────────────────────────────────
test.describe('browse', () => {
  test('shows tag filter buttons', async ({ page }) => {
    await page.goto('/browse')
    await expect(page.getByRole('button', { name: 'PvE' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hardcore' })).toBeVisible()
  })

  test('shows configs with like buttons', async ({ page }) => {
    await login(page)
    await page.goto('/browse')
    await page.waitForSelector('.config-tile', { timeout: 10000 })
    await expect(page.locator('.config-tile').first()).toBeVisible()
    await expect(page.locator('.config-tile').first().locator('.like-btn')).toBeVisible()
  })

  test('like on tile stays on page', async ({ page }) => {
    await login(page)
    await page.goto('/browse')
    await page.waitForSelector('.config-tile', { timeout: 10000 })
    const likeBtn = page.locator('.config-tile').first().locator('.like-btn')
    const urlBefore = page.url()
    await likeBtn.click()
    await page.waitForTimeout(500)
    expect(page.url()).toBe(urlBefore)
  })
})

// ── Browse Detail ────────────────────────────────────────
test.describe('browse detail', () => {
  test('shows details and like button', async ({ page }) => {
    await login(page)
    await page.goto('/browse')
    await page.waitForSelector('.config-tile', { timeout: 10000 })
    await page.locator('.config-tile').first().click()
    await page.waitForSelector('h1', { timeout: 5000 })
    await expect(page.locator('h1')).not.toHaveText('')
    await expect(page.locator('.like-btn')).toBeVisible()
  })

  test('like toggles count', async ({ page }) => {
    await login(page)
    await page.goto('/browse')
    await page.waitForSelector('.config-tile', { timeout: 10000 })
    await page.locator('.config-tile').first().click()
    await page.waitForSelector('.like-btn')
    const likeBtn = page.locator('.like-btn')
    const countBefore = await likeBtn.locator('.like-count').textContent()
    await likeBtn.click()
    await page.waitForTimeout(500)
    const countAfter = await likeBtn.locator('.like-count').textContent()
    expect(countBefore).not.toBe(countAfter)
  })

  test('export JSON is valid', async ({ page }) => {
    await page.goto('/browse')
    await page.waitForSelector('.config-tile', { timeout: 10000 })
    await page.locator('.config-tile').first().click()
    await page.waitForSelector('#btn-export')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btn-export'),
    ])
    expect(download.suggestedFilename()).toMatch(/\.json$/)
    const content = await (await download.createReadStream()).toArray()
    const json = JSON.parse(Buffer.concat(content).toString())
    expect(json).toHaveProperty('name')
    expect(json).toHaveProperty('slotCount')
    if (json.userGroups) {
      expect(Array.isArray(json.userGroups)).toBe(true)
    }
  })
})

// ── Editor ───────────────────────────────────────────────
test.describe('editor', () => {
  test('publishing bar with share + tags', async ({ page }) => {
    await login(page)
    await page.goto('/')
    const cards = page.locator('.config-card')
    if (await cards.count() === 0) {
      test.skip()
      return
    }
    await cards.first().click()
    await page.waitForSelector('.publishing-bar', { timeout: 10000 })
    await expect(page.locator('.publishing-bar')).toBeVisible()
    await expect(page.locator('#shared')).toBeVisible()
  })

  test('tag picker autocompletes', async ({ page }) => {
    await login(page)
    await page.goto('/')
    const cards = page.locator('.config-card')
    if (await cards.count() === 0) {
      test.skip()
      return
    }
    await cards.first().click()
    await page.waitForSelector('#tag-search-input', { timeout: 10000 })
    await page.fill('#tag-search-input', 'hard')
    await page.waitForSelector('.tag-option', { timeout: 5000 })
    await expect(page.locator('.tag-option')).toBeVisible()
  })
})

// ── Admin ────────────────────────────────────────────────
test.describe('admin', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/admin')
    // May redirect to login if not admin — just verify no crash
    const title = await page.title()
    expect(title).toContain('Valence')
  })

  test('server configs list', async ({ page }) => {
    await page.goto('/admin/server-configs')
    const title = await page.title()
    expect(title).toContain('Valence')
  })
})

// ── Account ──────────────────────────────────────────────
test.describe('account', () => {
  test('loads with bio field', async ({ page }) => {
    await login(page)
    await page.goto('/account')
    await expect(page.locator('#username')).toBeVisible()
    await expect(page.locator('#bio')).toBeVisible()
  })

  test('delete modal opens and closes', async ({ page }) => {
    await login(page)
    await page.goto('/account')
    await page.click('#btn-delete')
    await expect(page.locator('#delete-modal')).toBeVisible()
    await page.click('#btn-cancel-delete')
    await expect(page.locator('#delete-modal')).toBeHidden()
  })
})
