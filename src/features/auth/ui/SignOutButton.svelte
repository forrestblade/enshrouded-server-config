<script lang="ts">
  // Sign out via a direct call to Better Auth's endpoint with the exact shape it
  // accepts: JSON content-type + `{}` body (a bodyless POST 415s; a no-content-type
  // POST 415s). JSON content-type is also CSRF-safe. Same-origin fetch sends the
  // session cookie, so the server clears it; we then hard-navigate so middleware
  // re-resolves the now-empty session. Navigate regardless of the result.
  let { redirect = '/' }: { redirect?: string } = $props()
  let loading = $state(false)

  async function go () {
    if (loading) return
    loading = true
    try {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
    } catch { /* ignore — navigate regardless; middleware re-checks the session */ }
    window.location.assign(redirect)
  }
</script>

<button class="btn btn-ghost" onclick={go} disabled={loading}>
  {loading ? 'Signing out…' : 'Sign out'}
</button>
