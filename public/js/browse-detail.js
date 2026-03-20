const configId = window.location.pathname.split('/').pop()
const toast = document.getElementById('toast')

function showToast (msg, type) {
  toast.textContent = msg
  toast.className = 'toast ' + type + ' visible'
  setTimeout(() => { toast.className = 'toast' }, 2500)
}

// Check if user is logged in
let currentUser = null
const hasCookie = document.cookie.includes('cms_session')
if (hasCookie) {
  const meRes = await fetch('/api/users/me')
  if (meRes.ok) currentUser = await meRes.json()
}

// Fetch config
const res = await fetch('/api/server-configs/' + configId)
if (!res.ok) {
  document.getElementById('not-found').hidden = false
} else {
  const config = await res.json()

  // Only show if shared (or if it's your own)
  if (!config.shared && (!currentUser || config.owner !== currentUser.id)) {
    document.getElementById('not-found').hidden = false
  } else {
    document.getElementById('detail').hidden = false
    document.getElementById('config-name').textContent = config.name || 'Untitled'

    const meta = []
    meta.push('Preset: ' + (config.gameSettingsPreset || 'Default'))
    if (config.server?.slotCount) meta.push(config.server.slotCount + ' slots')
    if (config.updatedAt) meta.push('Updated ' + new Date(config.updatedAt).toLocaleDateString())
    document.getElementById('config-meta').textContent = meta.join(' · ')

    // Server settings
    const serverGrid = document.getElementById('server-settings')
    if (config.server) {
      for (const [key, val] of Object.entries(config.server)) {
        const field = document.createElement('div')
        field.className = 'detail-field'
        const label = document.createElement('div')
        label.className = 'detail-label'
        label.textContent = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
        const value = document.createElement('div')
        value.className = 'detail-value'
        value.textContent = String(val)
        field.appendChild(label)
        field.appendChild(value)
        serverGrid.appendChild(field)
      }
    }

    // Game settings
    const gameGrid = document.getElementById('game-settings')
    if (config.gameSettings) {
      for (const [key, val] of Object.entries(config.gameSettings)) {
        const field = document.createElement('div')
        field.className = 'detail-field'
        const label = document.createElement('div')
        label.className = 'detail-label'
        label.textContent = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
        const value = document.createElement('div')
        value.className = 'detail-value'
        value.textContent = String(val)
        field.appendChild(label)
        field.appendChild(value)
        gameGrid.appendChild(field)
      }
    }

    // User groups
    const groupsDiv = document.getElementById('user-groups')
    const groups = Array.isArray(config.userGroups) ? config.userGroups : []
    for (const group of groups) {
      const card = document.createElement('div')
      card.className = 'detail-group-card'
      const h3 = document.createElement('h3')
      h3.textContent = group.name || 'Unnamed Group'
      card.appendChild(h3)

      const perms = []
      if (group.canKickBan) perms.push('Kick/Ban')
      if (group.canAccessInventories) perms.push('Inventories')
      if (group.canEditBase) perms.push('Edit Base')
      if (group.canExtendBase) perms.push('Extend Base')
      const p = document.createElement('p')
      p.className = 'group-perms'
      p.textContent = perms.length ? perms.join(', ') : 'No special permissions'
      card.appendChild(p)

      if (group.reservedSlots) {
        const rs = document.createElement('p')
        rs.className = 'group-reserved'
        rs.textContent = 'Reserved slots: ' + group.reservedSlots
        card.appendChild(rs)
      }
      groupsDiv.appendChild(card)
    }

    // Clone button (logged-in users only)
    if (currentUser) {
      const cloneBtn = document.getElementById('btn-clone')
      cloneBtn.hidden = false
      cloneBtn.addEventListener('click', async () => {
        cloneBtn.disabled = true
        const cloneRes = await fetch('/api/server-configs/' + configId + '/clone', { method: 'POST' })
        if (cloneRes.ok) {
          const cloned = await cloneRes.json()
          window.location.href = '/config/' + cloned.id
        } else {
          showToast('Failed to clone config', 'error')
          cloneBtn.disabled = false
        }
      })
    }

    // Export JSON
    document.getElementById('btn-export').addEventListener('click', () => {
      const exportData = {
        name: config.server?.serverName || config.name,
        saveDirectory: config.server?.saveDirectory || './savegame',
        logDirectory: config.server?.logDirectory || './logs',
        ip: config.server?.ip || '0.0.0.0',
        gamePort: config.server?.queryPort || 15637,
        queryPort: config.server?.queryPort || 15637,
        slotCount: config.server?.slotCount || 16,
        gameSettingsPreset: config.gameSettingsPreset || 'Default',
        gameSettings: config.gameSettings || {},
        userGroups: config.userGroups || []
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = (config.name || 'config').replace(/[^a-z0-9]/gi, '_') + '.json'
      a.click()
      URL.revokeObjectURL(a.href)
      showToast('JSON exported', 'success')
    })
  }
}
