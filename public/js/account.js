// Redirect if not logged in
const meRes = await fetch('/api/users/me')
if (!meRes.ok) {
  window.location.href = '/login'
  throw new Error('Not authenticated')
}
const user = await meRes.json()

const form = document.getElementById('account-form')
const message = document.getElementById('message')
const avatarInput = document.getElementById('avatarUrl')
const preview = document.getElementById('avatar-preview')

// Populate fields
document.getElementById('username').value = user.username || ''
document.getElementById('email').value = user.email || ''
avatarInput.value = user.avatarUrl || ''
updatePreview()

function updatePreview () {
  const url = avatarInput.value.trim()
  preview.textContent = ''
  if (url) {
    const img = document.createElement('img')
    img.src = url
    img.alt = 'Avatar'
    img.width = 48
    img.height = 48
    preview.appendChild(img)
  }
}

avatarInput.addEventListener('input', updatePreview)

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  message.textContent = ''
  message.className = 'form-message'

  const res = await fetch('/api/account', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: document.getElementById('username').value.trim(),
      avatarUrl: avatarInput.value.trim()
    })
  })

  if (res.ok) {
    message.textContent = 'Changes saved.'
    message.className = 'form-message success'
  } else {
    const body = await res.json().catch(() => ({}))
    message.textContent = body.error || 'Failed to save.'
    message.className = 'form-message error'
  }
})

// Delete account
const modal = document.getElementById('delete-modal')
document.getElementById('btn-delete').addEventListener('click', () => { modal.hidden = false })
document.getElementById('btn-cancel-delete').addEventListener('click', () => { modal.hidden = true })
document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
  const btn = document.getElementById('btn-confirm-delete')
  btn.disabled = true
  btn.textContent = 'Deleting\u2026'

  const res = await fetch('/api/account', { method: 'DELETE' })
  if (res.ok) {
    window.location.href = '/'
  } else {
    btn.disabled = false
    btn.textContent = 'Delete My Account'
    modal.hidden = true
    message.textContent = 'Failed to delete account.'
    message.className = 'form-message error'
  }
})
