import { t } from './i18n.js'
const username = window.location.pathname.split('/').pop()

const res = await fetch('/api/users/profile/' + encodeURIComponent(username))
if (!res.ok) {
  document.getElementById('not-found').hidden = false
} else {
  const data = await res.json()
  document.getElementById('profile').hidden = false

  // Avatar
  const avatarDiv = document.getElementById('profile-avatar')
  if (data.avatarUrl) {
    const img = document.createElement('img')
    img.src = data.avatarUrl
    img.alt = (data.username || 'User') + "'s avatar"
    img.width = 96
    img.height = 96
    avatarDiv.appendChild(img)
  } else {
    const placeholder = document.createElement('div')
    placeholder.className = 'avatar-placeholder'
    placeholder.textContent = (data.username || '?').charAt(0).toUpperCase()
    avatarDiv.appendChild(placeholder)
  }

  // Username
  document.getElementById('profile-username').textContent = data.username

  // Bio
  const bioEl = document.getElementById('profile-bio')
  if (data.bio) {
    bioEl.textContent = data.bio
  } else {
    bioEl.hidden = true
  }

  // Join date
  const joinDate = data.createdAt ? new Date(data.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : ''
  document.getElementById('profile-meta').textContent = joinDate ? t('profile.joined', { date: joinDate }) : ''

  // Stats
  const configs = data.configs || []
  const totalForks = configs.reduce((sum, c) => sum + (c.forkCount || 0), 0)
  const totalLikes = configs.reduce((sum, c) => sum + (c.likeCount || 0), 0)

  const statsDiv = document.getElementById('profile-stats')
  const stats = [
    { label: 'Configs', value: configs.length },
    { label: 'Total Forks', value: totalForks },
    { label: 'Total Likes', value: totalLikes }
  ]
  for (const stat of stats) {
    const el = document.createElement('div')
    el.className = 'stat-item'
    const val = document.createElement('div')
    val.className = 'stat-value'
    val.textContent = stat.value
    const lbl = document.createElement('div')
    lbl.className = 'stat-label'
    lbl.textContent = stat.label
    el.appendChild(val)
    el.appendChild(lbl)
    statsDiv.appendChild(el)
  }

  // Config grid
  const grid = document.getElementById('profile-config-grid')
  const emptyMsg = document.getElementById('profile-empty')

  if (configs.length === 0) {
    emptyMsg.hidden = false
  } else {
    for (const item of configs) {
      const tile = document.createElement('a')
      tile.className = 'config-tile'
      tile.href = '/browse/' + item.id
      tile.setAttribute('role', 'article')
      tile.setAttribute('aria-label', item.name || 'Untitled')
      tile.dataset.telemetryType = 'CLICK'
      tile.dataset.telemetryTarget = 'profile.config-tile'

      const header = document.createElement('div')
      header.className = 'tile-header'
      const name = document.createElement('h3')
      name.textContent = item.name || 'Untitled'
      header.appendChild(name)
      const badge = document.createElement('span')
      badge.className = 'preset-badge'
      badge.textContent = item.gameSettingsPreset || 'Default'
      header.appendChild(badge)
      tile.appendChild(header)

      const meta = document.createElement('div')
      meta.className = 'tile-meta'
      const slots = item.server?.slotCount ?? 16
      const date = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''
      meta.textContent = [slots + ' slots', date].filter(Boolean).join(' \u00b7 ')
      tile.appendChild(meta)

      const footer = document.createElement('div')
      footer.className = 'tile-footer'

      if (item.forkCount > 0) {
        const forkSpan = document.createElement('span')
        forkSpan.className = 'tile-stat'
        forkSpan.textContent = '\u2442 ' + item.forkCount
        forkSpan.setAttribute('aria-label', item.forkCount === 1 ? t('browse.fork', { count: item.forkCount }) : t('browse.forks', { count: item.forkCount }))
        footer.appendChild(forkSpan)
      }

      if (item.likeCount > 0) {
        const likeSpan = document.createElement('span')
        likeSpan.className = 'tile-stat'
        likeSpan.textContent = '\u2665 ' + item.likeCount
        likeSpan.setAttribute('aria-label', item.likeCount + (item.likeCount === 1 ? ' like' : ' likes'))
        footer.appendChild(likeSpan)
      }

      tile.appendChild(footer)
      grid.appendChild(tile)
    }
  }
}
