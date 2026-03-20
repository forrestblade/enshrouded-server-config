import { presets, diffFromDefault } from './presets.js'

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

    // Diff-from-default summary
    const settings = config.gameSettings || (presets[config.gameSettingsPreset] ? { ...presets[config.gameSettingsPreset] } : null)
    const diff = diffFromDefault(settings, config.gameSettingsPreset)
    if (diff) {
      const diffEl = document.createElement('p')
      diffEl.className = 'diff-summary'
      diffEl.textContent = diff
      const metaEl = document.getElementById('config-meta')
      metaEl.parentNode.insertBefore(diffEl, metaEl.nextSibling)
    }

    // Forked from attribution
    if (config.forkedFrom) {
      try {
        const sourceRes = await fetch('/api/server-configs/' + config.forkedFrom)
        if (sourceRes.ok) {
          const source = await sourceRes.json()
          const forkInfo = document.createElement('p')
          forkInfo.className = 'fork-info'
          const forkLink = document.createElement('a')
          forkLink.href = '/browse/' + source.id
          forkLink.textContent = source.name || 'Untitled'
          forkInfo.textContent = 'Forked from '
          forkInfo.appendChild(forkLink)
          document.getElementById('config-meta').after(forkInfo)
        }
      } catch { /* ignore */ }
    }

    // Fork count
    if (config.forkCount > 0) {
      const forkCount = document.createElement('span')
      forkCount.className = 'fork-count-badge'
      forkCount.textContent = config.forkCount + (config.forkCount === 1 ? ' fork' : ' forks')
      document.getElementById('config-meta').appendChild(document.createTextNode(' · '))
      document.getElementById('config-meta').appendChild(forkCount)
    }

    // Tags display
    const tagsArr = typeof config.tags === 'string' ? JSON.parse(config.tags) : (config.tags || [])
    if (tagsArr.length > 0) {
      const tagsDiv = document.createElement('div')
      tagsDiv.className = 'detail-tags'
      for (const slug of tagsArr) {
        const tag = document.createElement('span')
        tag.className = 'tag'
        tag.textContent = slug
        tagsDiv.appendChild(tag)
      }
      document.getElementById('config-meta').after(tagsDiv)
    }

    // Like button
    const likeBtn = document.createElement('button')
    likeBtn.className = 'like-btn'
    likeBtn.innerHTML = '<span class="like-icon">♡</span> <span class="like-count">' + (config.likeCount || 0) + '</span>'
    let isLiked = false
    let likeCount = config.likeCount || 0

    if (currentUser) {
      try {
        const likedRes = await fetch('/api/server-configs/' + configId + '/liked')
        if (likedRes.ok) {
          const likedData = await likedRes.json()
          isLiked = likedData.liked
          if (isLiked) {
            likeBtn.classList.add('liked')
            likeBtn.querySelector('.like-icon').textContent = '♥'
          }
        }
      } catch { /* ignore */ }
    }

    likeBtn.addEventListener('click', async () => {
      if (!currentUser) { showToast('Log in to like configs', 'error'); return }
      likeBtn.disabled = true
      try {
        const likeRes = await fetch('/api/server-configs/' + configId + '/like', { method: 'POST' })
        if (likeRes.ok) {
          const data = await likeRes.json()
          isLiked = data.liked
          likeCount += isLiked ? 1 : -1
          likeBtn.querySelector('.like-icon').textContent = isLiked ? '♥' : '♡'
          likeBtn.querySelector('.like-count').textContent = likeCount
          likeBtn.classList.toggle('liked', isLiked)
          if (isLiked) {
            likeBtn.style.transform = 'scale(1.2)'
            setTimeout(() => { likeBtn.style.transform = '' }, 200)
          }
        }
      } catch { showToast('Failed to like', 'error') }
      likeBtn.disabled = false
    })

    document.querySelector('.detail-actions').prepend(likeBtn)

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
    const gameEntries = config.gameSettings ? Object.entries(config.gameSettings) : []
    const preset = config.gameSettingsPreset || 'Default'
    if (gameEntries.length === 0 && preset !== 'Custom') {
      const msg = document.createElement('p')
      msg.className = 'preset-defaults-msg'
      msg.textContent = 'Using ' + preset + ' preset defaults'
      gameGrid.appendChild(msg)
    } else {
      for (const [key, val] of gameEntries) {
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
    const groups = typeof config.userGroups === 'string' ? JSON.parse(config.userGroups) : (config.userGroups || [])
    if (groups.length === 0) {
      const msg = document.createElement('p')
      msg.className = 'preset-defaults-msg'
      msg.textContent = 'No user groups configured'
      groupsDiv.appendChild(msg)
    } else {
      for (const group of groups) {
        const card = document.createElement('div')
        card.className = 'detail-group-card'

        const h3 = document.createElement('h3')
        h3.style.fontWeight = 'bold'
        h3.textContent = group.name || 'Unnamed Group'
        card.appendChild(h3)

        const passwordField = document.createElement('div')
        passwordField.className = 'detail-field'
        const passwordLabel = document.createElement('div')
        passwordLabel.className = 'detail-label'
        passwordLabel.textContent = 'Password'
        const passwordValue = document.createElement('div')
        passwordValue.className = 'detail-value'
        passwordValue.textContent = group.password ? 'Password protected' : 'No password'
        passwordField.appendChild(passwordLabel)
        passwordField.appendChild(passwordValue)
        card.appendChild(passwordField)

        const slotsField = document.createElement('div')
        slotsField.className = 'detail-field'
        const slotsLabel = document.createElement('div')
        slotsLabel.className = 'detail-label'
        slotsLabel.textContent = 'Reserved Slots'
        const slotsValue = document.createElement('div')
        slotsValue.className = 'detail-value'
        slotsValue.textContent = group.reservedSlots != null ? String(group.reservedSlots) : '0'
        slotsField.appendChild(slotsLabel)
        slotsField.appendChild(slotsValue)
        card.appendChild(slotsField)

        const permDefs = [
          { key: 'canKickBan', label: 'Can Kick/Ban' },
          { key: 'canAccessInventories', label: 'Can Access Inventories' },
          { key: 'canEditBase', label: 'Can Edit Base' },
          { key: 'canExtendBase', label: 'Can Extend Base' }
        ]
        for (const { key, label } of permDefs) {
          const permField = document.createElement('div')
          permField.className = 'detail-field'
          const permLabel = document.createElement('div')
          permLabel.className = 'detail-label'
          permLabel.textContent = label
          const permValue = document.createElement('div')
          permValue.className = 'detail-value'
          if (group[key]) {
            permValue.textContent = '\u2705'
          } else {
            permValue.textContent = '\u274c'
          }
          permField.appendChild(permLabel)
          permField.appendChild(permValue)
          card.appendChild(permField)
        }

        groupsDiv.appendChild(card)
      }
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
      const exportGroups = typeof config.userGroups === 'string' ? JSON.parse(config.userGroups) : (config.userGroups || [])
      const exportData = {
        name: config.server?.serverName || config.name,
        saveDirectory: config.server?.saveDirectory || './savegame',
        logDirectory: config.server?.logDirectory || './logs',
        ip: config.server?.ip || '0.0.0.0',
        queryPort: config.server?.queryPort || 15637,
        slotCount: config.server?.slotCount || 16,
        voiceChatMode: config.server?.voiceChatMode || 'Proximity',
        enableVoiceChat: config.server?.enableVoiceChat ?? true,
        enableTextChat: config.server?.enableTextChat ?? true,
        gameSettingsPreset: config.gameSettingsPreset || 'Default',
        ...(config.gameSettingsPreset === 'Custom' && config.gameSettings ? config.gameSettings : {}),
        userGroups: exportGroups
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
