import { t } from './i18n.js'
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

const bioInput = document.getElementById('bio')

// Populate fields
document.getElementById('username').value = user.username || ''
document.getElementById('email').value = user.email || ''
avatarInput.value = user.avatarUrl || ''
if (bioInput) bioInput.value = user.bio || ''
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

  const payload = {
    username: document.getElementById('username').value.trim(),
    avatarUrl: avatarInput.value.trim()
  }
  if (bioInput) payload.bio = bioInput.value.trim()

  const res = await fetch('/api/account', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (res.ok) {
    message.textContent = t('account.saved')
    message.className = 'form-message success'
  } else {
    const body = await res.json().catch(() => ({}))
    message.textContent = body.error || t('account.saveFailed')
    message.className = 'form-message error'
  }
})

// Delete account
const modal = document.getElementById('delete-modal')
const btnDeleteTrigger = document.getElementById('btn-delete')
btnDeleteTrigger.addEventListener('click', () => {
  modal.hidden = false
  document.getElementById('btn-cancel-delete').focus()
})
document.getElementById('btn-cancel-delete').addEventListener('click', () => {
  modal.hidden = true
  btnDeleteTrigger.focus()
})
const btnConfirmDelete = document.getElementById('btn-confirm-delete')
btnConfirmDelete.setAttribute('aria-describedby', 'delete-warning')
btnConfirmDelete.addEventListener('click', async () => {
  const btn = document.getElementById('btn-confirm-delete')
  btn.disabled = true
  btn.textContent = t('common.deleting')

  const res = await fetch('/api/account', { method: 'DELETE' })
  if (res.ok) {
    window.location.href = '/'
  } else {
    btnConfirmDelete.disabled = false
    btnConfirmDelete.textContent = 'Delete My Account'
    modal.hidden = true
    message.textContent = t('account.deleteFailed')
    message.className = 'form-message error'
  }
})
