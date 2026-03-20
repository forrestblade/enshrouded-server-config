const form = document.getElementById('login-form')
const errorEl = document.getElementById('error')
const btn = document.getElementById('btn-submit')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorEl.style.display = 'none'
  btn.disabled = true

  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message ?? 'Invalid email or password')
    }

    window.location.href = '/'
  } catch (err) {
    errorEl.textContent = err.message
    errorEl.style.display = 'block'
    btn.disabled = false
  }
})
