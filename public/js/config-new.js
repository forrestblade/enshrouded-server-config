const form = document.getElementById('create-form')
const errorEl = document.getElementById('error')
const btn = document.getElementById('btn-submit')

// Get current user for ownership
let currentUser = null

try {
  const meRes = await fetch('/api/users/me')
  if (meRes.ok) {
    currentUser = await meRes.json()
  }
} catch { /* not logged in */ }

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorEl.style.display = 'none'
  btn.disabled = true

  const name = document.getElementById('name').value.trim()
  const preset = document.getElementById('preset').value
  if (!name) {
    errorEl.textContent = 'Name is required.'
    errorEl.style.display = 'block'
    btn.disabled = false
    return
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const body = { name, slug, gameSettingsPreset: preset }
  if (currentUser) {
    body.owner = currentUser.id
  }

  try {
    const res = await fetch('/api/server-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message ?? `Failed to create config (${res.status})`)
    }

    const config = await res.json()
    window.location.href = '/config/' + config.id
  } catch (err) {
    errorEl.textContent = err.message
    errorEl.style.display = 'block'
    btn.disabled = false
  }
})
