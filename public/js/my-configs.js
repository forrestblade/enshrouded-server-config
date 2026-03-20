const container = document.getElementById('config-list')
const loading = document.getElementById('loading')

const res = await fetch('/api/users/me/configs')
if (!res.ok) {
  window.location.href = '/login'
  // redirected by nav.js
}

const configs = await res.json()
loading.remove()

if (configs.length === 0) {
  container.innerHTML = '<p class="empty">No configs yet. <a href="/config/new">Create your first one!</a></p>'
} else {
  for (const c of configs) {
    const tile = document.createElement('a')
    tile.href = '/config/' + c.id
    tile.className = 'config-tile'

    const statusClass = c.shared ? 'published' : 'draft'
    const statusLabel = c.shared ? 'Published' : 'Draft'

    const preset = c.gameSettingsPreset || 'Default'
    const maxPlayers = c.server?.maxPlayers ?? '—'
    const updated = c.updated_at ? new Date(c.updated_at).toLocaleDateString() : ''

    tile.innerHTML = `
      <div class="tile-header">
        <h3>${escapeHtml(c.name || 'Untitled')}</h3>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="tile-meta">${escapeHtml(preset)} · ${escapeHtml(String(maxPlayers))} players · Updated ${escapeHtml(updated)}</div>
      <div class="tile-footer">
        <span class="tile-stat">${c.likeCount ?? 0} likes</span>
        <span class="tile-stat">${c.forkCount ?? 0} forks</span>
      </div>
    `
    container.appendChild(tile)
  }
}

function escapeHtml (str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
