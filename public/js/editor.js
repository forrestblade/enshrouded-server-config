import { presets, defaultUserGroups, gameSettingsFields } from './presets.js'

// ── State ──────────────────────────────────────────────────
const configId = window.location.pathname.split('/').pop()
let config = null
let userGroups = []

// ── Toast ─────────────────────────────────────────────────
function showToast (msg, type = 'success') {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.className = 'toast ' + type + ' visible'
  setTimeout(() => { el.classList.remove('visible') }, 2500)
}

// ── Build game settings grid dynamically ──────────────────
function buildGameSettingsGrid () {
  const grid = document.getElementById('game-settings-grid')

  // Default values sourced from the Default preset (same as valence.config.ts base)
  const GAME_DEFAULTS = presets.Default

  for (const f of gameSettingsFields) {
    const div = document.createElement('div')
    div.className = 'field'

    const label = document.createElement('label')
    label.textContent = f.label
    label.title = f.tip
    div.appendChild(label)

    if (f.type === 'pct') {
      div.dataset.pct = f.id
      const wrap = document.createElement('div')
      wrap.className = 'pct-control'

      const numInput = document.createElement('input')
      numInput.type = 'number'
      numInput.id = f.id
      numInput.dataset.path = 'gameSettings.' + f.id
      numInput.step = String(f.step ?? 0.01)
      numInput.min = String(f.min)
      numInput.max = String(f.max)
      numInput.value = String(GAME_DEFAULTS[f.id] ?? 1.0)

      const rangeInput = document.createElement('input')
      rangeInput.type = 'range'
      rangeInput.min = String(f.min)
      rangeInput.max = String(f.max)
      rangeInput.step = String(f.step ?? 0.01)
      rangeInput.value = String(GAME_DEFAULTS[f.id] ?? 1.0)
      rangeInput.setAttribute('aria-label', f.label + ' slider')

      const pctLabel = document.createElement('span')
      pctLabel.className = 'pct-label'

      wrap.appendChild(numInput)
      wrap.appendChild(rangeInput)
      wrap.appendChild(pctLabel)
      div.appendChild(wrap)
    } else if (f.type === 'duration') {
      div.dataset.duration = ''
      const numInput = document.createElement('input')
      numInput.type = 'number'
      numInput.id = f.id
      numInput.dataset.path = 'gameSettings.' + f.id
      numInput.step = '60000000000'
      numInput.value = String(GAME_DEFAULTS[f.id] ?? 0)
      div.appendChild(numInput)

      const durLabel = document.createElement('div')
      durLabel.className = 'duration-label'
      durLabel.id = f.id + '-mins'
      div.appendChild(durLabel)
    } else if (f.type === 'select') {
      const select = document.createElement('select')
      select.id = f.id
      select.dataset.path = 'gameSettings.' + f.id
      for (const opt of f.options) {
        const o = document.createElement('option')
        o.value = opt.v
        o.textContent = opt.l
        select.appendChild(o)
      }
      select.value = String(GAME_DEFAULTS[f.id] ?? 0)
      div.appendChild(select)
    } else {
      const numInput = document.createElement('input')
      numInput.type = 'number'
      numInput.id = f.id
      numInput.dataset.path = 'gameSettings.' + f.id
      if (f.min !== undefined) numInput.min = String(f.min)
      numInput.value = String(GAME_DEFAULTS[f.id] ?? 0)
      div.appendChild(numInput)
    }

    grid.appendChild(div)
  }
}

// ── Percentage controls ───────────────────────────────────
function initPctControls () {
  for (const field of document.querySelectorAll('[data-pct]')) {
    const numInput = field.querySelector('input[type="number"]')
    const rangeInput = field.querySelector('input[type="range"]')
    const label = field.querySelector('.pct-label')
    if (!numInput || !rangeInput || !label) continue

    function sync (value) {
      const v = parseFloat(value)
      if (isNaN(v)) return
      numInput.value = v
      rangeInput.value = v
      label.textContent = Math.round(v * 100) + '%'
    }

    numInput.addEventListener('input', () => sync(numInput.value))
    rangeInput.addEventListener('input', () => sync(rangeInput.value))
    sync(numInput.value)
  }
}

// ── Duration labels ───────────────────────────────────────
function updateDurationLabels () {
  for (const field of document.querySelectorAll('[data-duration]')) {
    const input = field.querySelector('input[type="number"]')
    const label = field.querySelector('.duration-label')
    if (!input || !label) continue

    function update () {
      const ns = parseFloat(input.value)
      if (isNaN(ns)) { label.textContent = ''; return }
      label.textContent = (ns / 60000000000).toFixed(1) + ' minutes'
    }

    input.addEventListener('input', update)
    update()
  }
}

// ── Preset switching ──────────────────────────────────────
function initPresetSwitching () {
  const select = document.getElementById('gameSettingsPreset')
  const customDiv = document.getElementById('custom-settings')

  select.addEventListener('change', () => {
    const preset = select.value
    customDiv.hidden = preset !== 'Custom'
    if (preset !== 'Custom' && presets[preset]) {
      applyGameSettings(presets[preset])
    }
  })

  customDiv.hidden = select.value !== 'Custom'
}

function applyGameSettings (settings) {
  for (const [key, value] of Object.entries(settings)) {
    const el = document.getElementById(key)
    if (!el) continue
    el.value = el.tagName === 'SELECT' ? String(value) : value
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

// ── User Groups ───────────────────────────────────────────
function renderGroups () {
  const list = document.getElementById('group-list')
  list.innerHTML = ''

  userGroups.forEach((group, index) => {
    const card = document.createElement('div')
    card.className = 'group-card'

    // Header
    const header = document.createElement('div')
    header.className = 'group-header'

    const nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.className = 'group-name'
    nameInput.value = group.name
    nameInput.addEventListener('input', () => { userGroups[index].name = nameInput.value })
    header.appendChild(nameInput)

    if (userGroups.length > 1) {
      const delBtn = document.createElement('button')
      delBtn.className = 'btn btn-danger'
      delBtn.textContent = 'Delete'
      delBtn.addEventListener('click', () => { userGroups.splice(index, 1); renderGroups() })
      header.appendChild(delBtn)
    }
    card.appendChild(header)

    // Fields
    const fields = document.createElement('div')
    fields.className = 'group-fields'

    // Password
    const pwField = document.createElement('div')
    pwField.className = 'field'
    pwField.innerHTML = '<label>Password</label>'
    const pwInput = document.createElement('input')
    pwInput.type = 'text'
    pwInput.value = group.password
    pwInput.placeholder = 'Optional'
    pwInput.addEventListener('input', () => { userGroups[index].password = pwInput.value })
    pwField.appendChild(pwInput)
    fields.appendChild(pwField)

    // Reserved Slots
    const slotsField = document.createElement('div')
    slotsField.className = 'field'
    slotsField.innerHTML = '<label>Reserved Slots</label>'
    const slotsInput = document.createElement('input')
    slotsInput.type = 'number'
    slotsInput.min = '0'
    slotsInput.value = group.reservedSlots
    slotsInput.addEventListener('input', () => { userGroups[index].reservedSlots = parseInt(slotsInput.value) || 0 })
    slotsField.appendChild(slotsInput)
    fields.appendChild(slotsField)

    // Boolean toggles
    const toggles = [
      { key: 'canKickBan', label: 'Can Kick/Ban' },
      { key: 'canAccessInventories', label: 'Can Access Inventories' },
      { key: 'canEditBase', label: 'Can Edit Base' },
      { key: 'canExtendBase', label: 'Can Extend Base' }
    ]

    for (const toggle of toggles) {
      const tf = document.createElement('div')
      tf.className = 'toggle-field'
      const cb = document.createElement('input')
      cb.type = 'checkbox'
      cb.id = `group-${index}-${toggle.key}`
      cb.checked = group[toggle.key]
      cb.addEventListener('change', () => { userGroups[index][toggle.key] = cb.checked })
      const lbl = document.createElement('label')
      lbl.htmlFor = cb.id
      lbl.textContent = toggle.label
      tf.appendChild(cb)
      tf.appendChild(lbl)
      fields.appendChild(tf)
    }

    card.appendChild(fields)
    list.appendChild(card)
  })
}

// ── Server field defaults (mirrors valence.config.ts) ─────
// Used to pre-fill inputs when the API returns null/undefined for a field
// (e.g. a freshly created config whose nested server group is not yet stored).
const SERVER_DEFAULTS = {
  'server.serverName': 'My Enshrouded Server',
  'server.saveDirectory': './savegame',
  'server.logDirectory': './logs',
  'server.ip': '0.0.0.0',
  'server.queryPort': 15637,
  'server.slotCount': 16,
  'server.voiceChatMode': 'Proximity',
  'server.enableVoiceChat': true,
  'server.enableTextChat': true
}

// ── Load config ───────────────────────────────────────────
async function loadConfig () {
  const res = await fetch('/api/server-configs/' + configId)
  if (!res.ok) {
    document.getElementById('not-found').hidden = false
    return
  }

  config = await res.json()
  document.getElementById('editor').hidden = false
  document.getElementById('config-title').textContent = config.name

  // Populate all fields with data-path
  for (const el of document.querySelectorAll('[data-path]')) {
    const path = el.dataset.path.split('.')
    let value = config
    for (const key of path) value = value?.[key]

    // Fall back to SERVER_DEFAULTS when the API returns null/undefined
    // (e.g. a freshly created config whose nested group fields are not yet set)
    if (value === undefined || value === null) {
      value = SERVER_DEFAULTS[el.dataset.path]
    }

    if (value === undefined || value === null) continue

    if (el.type === 'checkbox') {
      el.checked = Boolean(value)
    } else {
      el.value = value
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // Load user groups
  const rawGroups = typeof config.userGroups === "string" ? JSON.parse(config.userGroups) : config.userGroups
  userGroups = Array.isArray(rawGroups)
    ? rawGroups.map(g => ({ ...g }))
    : defaultUserGroups.map(g => ({ ...g }))
  renderGroups()

  initPctControls()
  updateDurationLabels()
  initPresetSwitching()

  // Restore draft if one exists (overrides server data with local edits)
  const draft = loadDraft()
  if (draft) {
    for (const el of document.querySelectorAll('[data-path]')) {
      const path = el.dataset.path.split('.')
      let value = draft
      for (const key of path) value = value?.[key]
      if (value === undefined || value === null) continue
      if (el.type === 'checkbox') el.checked = Boolean(value)
      else el.value = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    if (Array.isArray(draft._userGroups)) {
      userGroups = draft._userGroups.map(g => ({ ...g }))
      renderGroups()
    }
    showToast('Draft restored')
  }
}

// ── Collect form data ─────────────────────────────────────
function collectFormData () {
  const data = { server: {}, gameSettings: {} }

  for (const el of document.querySelectorAll('[data-path]')) {
    const path = el.dataset.path.split('.')
    let target = data
    for (let i = 0; i < path.length - 1; i++) {
      if (!target[path[i]]) target[path[i]] = {}
      target = target[path[i]]
    }
    const key = path[path.length - 1]
    if (el.type === 'checkbox') {
      target[key] = el.checked
    } else if (el.type === 'number') {
      const num = parseFloat(el.value)
      target[key] = isNaN(num) ? (parseFloat(el.defaultValue) || 0) : num
    } else {
      target[key] = el.value
    }
  }

  // Only send custom gameSettings values when the user has chosen the Custom preset.
  // For named presets (Default, Relaxed, Hard, Survival) the server applies its own
  // defaults, so sending potentially-stale or empty fields would trigger validation
  // errors and override the server-side preset logic.
  const preset = data.gameSettingsPreset
  if (preset && preset !== 'Custom') {
    delete data.gameSettings
  }

  // The CMS REST API validates field.json as a JSON-encoded string (z.string().refine(...)),
  // so userGroups must be serialized to a string here before being sent in the PATCH body.
  data.userGroups = JSON.stringify(userGroups.map(g => ({ ...g })))
  return data
}

// ── Auto-draft (localStorage) ─────────────────────────────
const DRAFT_KEY = 'enshrouded-draft-' + configId
let draftTimer = null

function saveDraft () {
  try {
    const data = collectFormData()
    data._userGroups = userGroups
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch { /* quota exceeded — ignore */ }
}

function loadDraft () {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function clearDraft () {
  localStorage.removeItem(DRAFT_KEY)
}

function scheduleDraftSave () {
  clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    saveDraft()
    showToast('Draft saved', 'success')
  }, 2000)
}

// Listen for any form changes to auto-save draft
document.addEventListener('input', scheduleDraftSave)
document.addEventListener('change', scheduleDraftSave)

// ── Save ──────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', async () => {
  const btn = document.getElementById('btn-save')
  btn.disabled = true
  try {
    const data = collectFormData()
    const res = await fetch('/api/server-configs/' + configId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      const body = await res.text()
      const tracker = document.createElement('span')
      tracker.dataset.telemetryType = 'FORM_INPUT'
      tracker.dataset.telemetryTarget = 'editor.save-failed'
      tracker.style.display = 'none'
      document.body.appendChild(tracker)
      tracker.click()
      tracker.remove()
      throw new Error('Save failed: ' + (body || res.status))
    }
    config = await res.json()
    clearDraft()
    showToast('Config saved')
  } catch (err) {
    showToast(err.message, 'error')
  } finally {
    btn.disabled = false
  }
})

// ── Export JSON ───────────────────────────────────────────
document.getElementById('btn-export').addEventListener('click', () => {
  const data = collectFormData()
  const exported = {
    name: data.server.serverName,
    saveDirectory: data.server.saveDirectory,
    logDirectory: data.server.logDirectory,
    ip: data.server.ip,
    queryPort: data.server.queryPort,
    slotCount: data.server.slotCount,
    voiceChatMode: data.server.voiceChatMode,
    enableVoiceChat: data.server.enableVoiceChat,
    enableTextChat: data.server.enableTextChat,
    gameSettingsPreset: data.gameSettingsPreset,
    ...(data.gameSettingsPreset === 'Custom' ? data.gameSettings : {}),
    // data.userGroups is a JSON string (required by the CMS API); parse it back to an array
    // for the exported game config file which expects a plain array.
    userGroups: typeof data.userGroups === 'string' ? JSON.parse(data.userGroups) : data.userGroups
  }

  const json = JSON.stringify(exported, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'enshrouded_server.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showToast('JSON exported')
})

// ── Reset Defaults ────────────────────────────────────────
document.getElementById('btn-reset').addEventListener('click', () => {
  document.getElementById('serverName').value = 'My Enshrouded Server'
  document.getElementById('saveDirectory').value = './savegame'
  document.getElementById('logDirectory').value = './logs'
  document.getElementById('ip').value = '0.0.0.0'
  document.getElementById('queryPort').value = 15637
  document.getElementById('slotCount').value = 16
  document.getElementById('voiceChatMode').value = 'Proximity'
  document.getElementById('enableVoiceChat').checked = true
  document.getElementById('enableTextChat').checked = true
  document.getElementById('gameSettingsPreset').value = 'Default'
  document.getElementById('custom-settings').hidden = true

  applyGameSettings(presets.Default)
  userGroups = defaultUserGroups.map(g => ({ ...g }))
  renderGroups()
  showToast('Reset to defaults')
})

// ── Add Group ─────────────────────────────────────────────
document.getElementById('btn-add-group').addEventListener('click', () => {
  userGroups.push({
    name: 'New Group', password: '',
    canKickBan: false, canAccessInventories: false,
    canEditBase: false, canExtendBase: false, reservedSlots: 0
  })
  renderGroups()
})

// ── Init ──────────────────────────────────────────────────
buildGameSettingsGrid()
loadConfig()
