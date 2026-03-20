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

// Fetch all shared configs
let allConfigs = []
const res = await fetch('/api/server-configs?shared=true')
if (res.ok) {
  allConfigs = await res.json()
  // Pre-resolve all owners
  const ownerIds = [...new Set(allConfigs.map(c => c.owner).filter(Boolean))]
  await Promise.all(ownerIds.map(id => resolveUser(id)))
}

const grid = document.getElementById('config-grid')
const empty = document.getElementById('empty')
const search = document.getElementById('search')
const filterPreset = document.getElementById('filter-preset')

function render (items) {
  grid.innerHTML = ''
  const filtered = items.filter(item => {
    const q = search.value.toLowerCase()
    const preset = filterPreset.value
    const nameMatch = !q || (item.name || '').toLowerCase().includes(q)
    const presetMatch = !preset || item.gameSettingsPreset === preset
    return nameMatch && presetMatch
  })
  empty.hidden = filtered.length > 0
  for (const item of filtered) {
    const owner = userCache[item.owner] || null
    grid.appendChild(createTile(item, owner))
  }
}

function createTile (item, owner) {
  const div = document.createElement('a')
  div.className = 'config-tile'
  div.href = '/browse/' + item.id

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

  const meta = document.createElement('div')
  meta.className = 'tile-meta'
  const slots = item.server?.slotCount ?? 16
  const date = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''
  meta.textContent = [slots + ' slots', date].filter(Boolean).join(' \u00b7 ')
  div.appendChild(meta)

  return div
}

render(allConfigs)
search.addEventListener('input', () => render(allConfigs))
filterPreset.addEventListener('change', () => render(allConfigs))
