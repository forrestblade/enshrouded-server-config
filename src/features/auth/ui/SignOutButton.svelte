<script lang="ts">
  import { signOut } from '@/shared/auth/client'

  let { redirect = '/' }: { redirect?: string } = $props()
  let loading = $state(false)

  async function go () {
    loading = true
    await signOut()
    // Full reload so server middleware re-resolves the (now empty) session.
    window.location.href = redirect
  }
</script>

<button class="btn btn-ghost" onclick={go} disabled={loading}>
  {loading ? 'Signing out…' : 'Sign out'}
</button>
