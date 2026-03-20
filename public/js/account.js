// Redirect if not logged in
const meRes = await fetch('/api/users/me')
if (!meRes.ok) {
  window.location.href = '/login'
  throw new Error('Not authenticated')
}
const user = await meRes.json()

// Populate fields
document.getElementById('username').value = user.username || ''
document.getElementById('email').value = user.email || ''
document.getElementById('avatarUrl').value = user.avatarUrl || ''
updatePreview()

const form = document.getElementById('account-form')
const message = document.getElementById('message')
const avatarInput = document.getElementById('avatarUrl')
const preview = document.getElementById('avatar-preview')

function updatePreview () {
  const url = document.getElementById('avatarUrl').value.trim()
  if (url) {
    preview.innerHTML = '<img src="' + url + '" alt="Avatar" width="48" height="48">'
  } else {
    preview.innerHTML = ''
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
      avatarUrl: document.getElementById('avatarUrl').value.trim()
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
  const res = await fetch('/api/account', { method: 'DELETE' })
  if (res.ok) {
    window.location.href = '/'
  } else {
    modal.hidden = true
    message.textContent = 'Failed to delete account.'
    message.className = 'form-message error'
  }
})
