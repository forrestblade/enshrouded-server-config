import { t } from './i18n.js'
const form = document.getElementById('signup-form')
const errorEl = document.getElementById('error')
const btn = document.getElementById('btn-submit')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorEl.style.display = 'none'
  btn.disabled = true

  const username = document.getElementById('username').value.trim()
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  if (!username || !email || !password) {
    errorEl.textContent = 'All fields are required.'
    errorEl.style.display = 'block'
    btn.disabled = false
    return
  }

  try {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message ?? t('auth.signupFailed'))
    }

    // Auto-login after signup
    const loginRes = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (loginRes.ok) {
      window.location.href = '/'
    } else {
      window.location.href = '/login'
    }
  } catch (err) {
    errorEl.textContent = err.message
    errorEl.style.display = 'block'
    btn.disabled = false
  }
})
