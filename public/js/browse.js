import { t } from './i18n.js'
import { presets, diffFromDefault } from './presets.js'

// Resolve owner UUIDs to user info
const userCache = {}
async function resolveUser (ownerId) {
  if (!ownerId) return null
  if (userCache[ownerId]) return userCache[ownerId]
  try {
    const res = await fetch('/api/users/' + ownerId)
    if (res.ok) {
      const user = await res.json()
      userCache[ownerId] = user
      return user
    }
  } catch { /* ignore */ }
  return null
}

// Fetch current user
let currentUser = null
try {
  const meRes = await fetch('/api/users/me')
  if (meRes.ok) currentUser = await meRes.json()
} catch { /* not logged in */ }

// Fetch user's liked config IDs
let myLikedIds = new Set()
if (currentUser) {
  try {
    const likesRes = await fetch('/api/likes/mine')
    if (likesRes.ok) {
      const ids = await likesRes.json()
      myLikedIds = new Set(ids)
    }
  } catch { /* ignore */ }
}

// Fetch tags for filter
let allTags = []
try {
  const tagsRes = await fetch('/api/tags')
  if (tagsRes.ok) allTags = await tagsRes.json()
} catch { /* ignore */ }

// Build tag filter UI
const tagFilterDiv = document.getElementById('tag-filters')
if (tagFilterDiv && allTags.length > 0) {
  const curatedTags = allTags.filter(t => t.isCurated)
  for (const tag of curatedTags) {
    const btn = document.createElement('button')
    btn.className = 'tag-filter-btn'
    btn.textContent = tag.name
    btn.dataset.slug = tag.slug
    btn.setAttribute('aria-pressed', 'false')
    btn.addEventListener('click', () => {
      btn.classList.toggle('active')
      btn.setAttribute('aria-pressed', String(btn.classList.contains('active')))
      render(allConfigs)
    })
    tagFilterDiv.appendChild(btn)
  }
}

// Fetch featured configs
const featuredRes = await fetch('/api/server-configs?shared=true&featured=true')
if (featuredRes.ok) {
  const featured = await featuredRes.json()
  if (featured.length > 0) {
    const section = document.getElementById('featured-section')
    section.hidden = false
    const list = document.getElementById('featured-list')
    for (const item of featured) {
      const owner = await resolveUser(item.owner)
      list.appendChild(createTile(item, owner))
    }
  }
}

// Fetch all shared configs (retry once on failure)
let allConfigs = []
async function fetchConfigs () {
  const res = await fetch('/api/server-configs?shared=true')
  if (!res.ok) throw new Error('Failed: ' + res.status)
  return res.json()
}
try {
  allConfigs = await fetchConfigs()
} catch {
  // Retry once after a short delay
  await new Promise(r => setTimeout(r, 500))
  try { allConfigs = await fetchConfigs() } catch { /* give up */ }
}
if (allConfigs.length > 0) {
  const ownerIds = [...new Set(allConfigs.map(c => c.owner).filter(Boolean))]
  await Promise.all(ownerIds.map(id => resolveUser(id)))
}

const grid = document.getElementById('config-grid')
const empty = document.getElementById('empty')
const search = document.getElementById('search')
const filterPreset = document.getElementById('filter-preset')

const sortSelect = document.getElementById('sort-by')
if (sortSelect) sortSelect.setAttribute('aria-label', 'Sort configs by')

if (search) search.setAttribute('aria-label', 'Search configs')

function getActiveTagSlugs () {
  const btns = document.querySelectorAll('.tag-filter-btn.active')
  return [...btns].map(b => b.dataset.slug)
}

function render (items) {
  grid.innerHTML = ''
  const activeTags = getActiveTagSlugs()

  const filtered = items.filter(item => {
    const q = search.value.toLowerCase()
    const preset = filterPreset.value
    const nameMatch = !q || (item.name || '').toLowerCase().includes(q)
    const presetMatch = !preset || item.gameSettingsPreset === preset

    // Tag filter
    let tagMatch = true
    if (activeTags.length > 0) {
      const itemTags = typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || [])
      tagMatch = activeTags.every(slug => itemTags.includes(slug))
    }

    return nameMatch && presetMatch && tagMatch
  })

  // Sorting
  const sortBy = sortSelect ? sortSelect.value : 'newest'
  if (sortBy === 'most-liked') {
    filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
  } else if (sortBy === 'most-forked') {
    filtered.sort((a, b) => (b.forkCount || 0) - (a.forkCount || 0))
  } else {
    filtered.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
  }

  empty.hidden = filtered.length > 0
  for (const item of filtered) {
    const owner = userCache[item.owner] || null
    grid.appendChild(createTile(item, owner))
  }
}

// Reactive like state — all tiles for the same config stay in sync
const likeState = {}  // configId -> { liked, count, subscribers[] }

function getLikeState (configId, initialCount) {
  if (!likeState[configId]) {
    likeState[configId] = {
      liked: myLikedIds.has(configId),
      count: initialCount || 0,
      subscribers: []
    }
  }
  return likeState[configId]
}

function subscribeLike (configId, callback) {
  const state = getLikeState(configId, 0)
  state.subscribers.push(callback)
  return state
}

function notifyLikeChange (configId) {
  const state = likeState[configId]
  if (!state) return
  for (const cb of state.subscribers) cb(state)
}

function createTile (item, owner) {
  const div = document.createElement('a')
  div.className = 'config-tile'
  div.href = '/browse/' + item.id
  div.setAttribute('role', 'article')
  div.setAttribute('aria-label', item.name || 'Untitled')
  div.dataset.telemetryType = 'CLICK'
  div.dataset.telemetryTarget = 'browse.config-tile'

  const header = document.createElement('div')
  header.className = 'tile-header'
  const name = document.createElement('h3')
  name.textContent = item.name || 'Untitled'
  header.appendChild(name)
  const badge = document.createElement('span')
  badge.className = 'preset-badge'
  badge.textContent = item.gameSettingsPreset || 'Default'
  header.appendChild(badge)
  div.appendChild(header)

  // Diff-from-default summary
  const settings = item.gameSettings || (presets[item.gameSettingsPreset] ? { ...presets[item.gameSettingsPreset] } : null)
  const diff = diffFromDefault(settings, item.gameSettingsPreset)
  if (diff) {
    const diffEl = document.createElement('p')
    diffEl.className = 'diff-summary'
    diffEl.textContent = diff
    div.appendChild(diffEl)
  }

  // Creator info
  if (owner) {
    const creator = document.createElement('div')
    creator.className = 'tile-creator'
    if (owner.avatarUrl) {
      const avatar = document.createElement('img')
      avatar.className = 'tile-avatar'
      avatar.src = owner.avatarUrl
      avatar.alt = owner.username || ''
      avatar.width = 24
      avatar.height = 24
      creator.appendChild(avatar)
    }
    const creatorName = document.createElement('span')
    creatorName.textContent = owner.username || 'Anonymous'
    creator.appendChild(creatorName)
    div.appendChild(creator)
  }

  // Tags
  const tagsArr = typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || [])
  if (tagsArr.length > 0) {
    const tagsDiv = document.createElement('div')
    tagsDiv.className = 'tile-tags'
    for (const slug of tagsArr.slice(0, 3)) {
      const tag = document.createElement('span')
      tag.className = 'tag'
      tag.textContent = slug
      tagsDiv.appendChild(tag)
    }
    if (tagsArr.length > 3) {
      const more = document.createElement('span')
      more.className = 'tag'
      more.textContent = '+' + (tagsArr.length - 3)
      tagsDiv.appendChild(more)
    }
    div.appendChild(tagsDiv)
  }

  const meta = document.createElement('div')
  meta.className = 'tile-meta'
  const slots = item.server?.slotCount ?? 16
  const date = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''
  const parts = [slots + ' slots', date]
  meta.textContent = parts.filter(Boolean).join(' \u00b7 ')
  div.appendChild(meta)

  // Footer with fork count and like count
  const footer = document.createElement('div')
  footer.className = 'tile-footer'

  if (item.forkCount > 0) {
    const forkSpan = document.createElement('span')
    forkSpan.className = 'tile-stat'
    forkSpan.textContent = '\u2442 ' + item.forkCount
    forkSpan.title = item.forkCount === 1 ? t('browse.fork', { count: item.forkCount }) : t('browse.forks', { count: item.forkCount })
    forkSpan.setAttribute('aria-label', item.forkCount === 1 ? t('browse.fork', { count: item.forkCount }) : t('browse.forks', { count: item.forkCount }))
    footer.appendChild(forkSpan)
  }

  const likeSpan = document.createElement('span')
  likeSpan.className = 'tile-stat like-btn'
  likeSpan.style.cursor = 'pointer'
  likeSpan.setAttribute('role', 'button')

  // Initialize from shared state
  const state = getLikeState(item.id, item.likeCount || 0)
  state.count = Math.max(state.count, item.likeCount || 0)

  function updateLikeUI (s) {
    likeSpan.textContent = (s.liked ? '\u2665' : '\u2661') + ' ' + s.count
    likeSpan.classList.toggle('liked', s.liked)
    likeSpan.setAttribute('aria-label', s.liked ? 'Unlike' : 'Like')
    likeSpan.setAttribute('aria-pressed', String(s.liked))
  }
  updateLikeUI(state)
  subscribeLike(item.id, updateLikeUI)

  likeSpan.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUser) return
    try {
      const res = await fetch('/api/server-configs/' + item.id + '/like', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        const s = likeState[item.id]
        s.liked = data.liked
        s.count += s.liked ? 1 : -1
        if (s.liked) myLikedIds.add(item.id); else myLikedIds.delete(item.id)
        notifyLikeChange(item.id)
      }
    } catch { /* ignore */ }
  })
  footer.appendChild(likeSpan)

  div.appendChild(footer)

  return div
}

render(allConfigs)
search.addEventListener('input', () => render(allConfigs))
filterPreset.addEventListener('change', () => render(allConfigs))
if (sortSelect) sortSelect.addEventListener('change', () => render(allConfigs))
