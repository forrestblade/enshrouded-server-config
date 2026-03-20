// Check auth state and update nav accordingly
const navActions = document.getElementById('nav-actions')
if (navActions) {
  try {
    const res = await fetch('/api/users/me')
    if (res.ok) {
        const user = await res.json()
        navActions.innerHTML = ''

        if (user.avatarUrl) {
          const avatar = document.createElement('img')
          avatar.className = 'nav-avatar'
          avatar.src = user.avatarUrl
          avatar.alt = user.username || user.name || 'Avatar'
          avatar.width = 28
          avatar.height = 28
          navActions.appendChild(avatar)
        }

        const userSpan = document.createElement('span')
        userSpan.className = 'nav-user'
        userSpan.textContent = user.username || user.name || user.email
        navActions.appendChild(userSpan)

        const accountLink = document.createElement('a')
        const myConfigsLink = document.createElement('a')
        myConfigsLink.className = 'btn btn-outline'
        myConfigsLink.href = '/my-configs'
        myConfigsLink.dataset.telemetryType = 'CLICK'
        myConfigsLink.dataset.telemetryTarget = 'nav.my-configs'
        myConfigsLink.textContent = 'My Configs'
        navActions.appendChild(myConfigsLink)

        accountLink.className = 'btn btn-outline'
        accountLink.href = '/account'
        accountLink.dataset.telemetryType = 'CLICK'
        accountLink.dataset.telemetryTarget = 'nav.account'
        accountLink.textContent = 'Account'
        navActions.appendChild(accountLink)

        const logoutBtn = document.createElement('button')
        logoutBtn.className = 'btn btn-outline'
        logoutBtn.textContent = 'Log Out'
        logoutBtn.dataset.telemetryType = 'CLICK'
        logoutBtn.dataset.telemetryTarget = 'nav.logout'
        logoutBtn.setAttribute('aria-label', 'Log out')
        logoutBtn.dataset.telemetryType = 'CLICK'
        logoutBtn.dataset.telemetryTarget = 'nav.logout'
        logoutBtn.addEventListener('click', async () => {
          await fetch('/api/users/logout', { method: 'POST' })
          window.location.href = '/'
        })
        navActions.appendChild(logoutBtn)
      }
  } catch {
    // Not logged in — keep default login/signup links
  }
}
