// Fetch current user (if logged in)
let currentUser = null
try {
  const meRes = await fetch('/api/users/me')
  if (meRes.ok) {
    currentUser = await meRes.json()
  }
} catch { /* not logged in */ }

const list = document.getElementById('config-list')
const empty = document.getElementById('empty')
const configs = document.getElementById('configs')
const welcome = document.getElementById('welcome')

// Show welcome section for logged-out users, configs section for logged-in
if (!currentUser) {
  configs.hidden = true
  welcome.hidden = false
} else {
  welcome.hidden = true
  configs.hidden = false

  const res = await fetch('/api/server-configs?owner=' + currentUser.id)
  if (res.ok) {
    const items = await res.json()

    if (items.length === 0) {
      empty.hidden = false
    }

    for (const item of items) {
      const a = document.createElement('a')
      a.className = 'config-card'
      a.href = '/config/' + item.id
      a.setAttribute('aria-label', 'Edit config: ' + (item.name ?? 'Untitled Config'))

      const info = document.createElement('div')
      info.className = 'info'
      const h3 = document.createElement('h3')
      h3.textContent = item.name ?? 'Untitled Config'
      info.appendChild(h3)

      const meta = document.createElement('div')
      meta.className = 'meta'
      const serverName = item.server?.serverName ?? ''
      const slots = item.server?.slotCount ?? 16
      const date = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''
      meta.textContent = [serverName, slots + ' slots', date].filter(Boolean).join(' \u00b7 ')
      info.appendChild(meta)

      a.appendChild(info)

      const preset = document.createElement('span')
      preset.className = 'preset'
      preset.textContent = item.gameSettingsPreset ?? 'Default'
      a.appendChild(preset)

      list.appendChild(a)
    }
  }
}
