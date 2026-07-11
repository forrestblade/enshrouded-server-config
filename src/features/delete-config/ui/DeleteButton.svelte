<script lang="ts">
  // Two-step delete (arm -> confirm) so it can't fire on a stray click.
  // Owner-only is enforced server-side; this is just the affordance.
  let { slug, redirect = '/account' }: { slug: string, redirect?: string } = $props()

  let confirming = $state(false)
  let busy = $state(false)
  let error = $state<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  function arm () {
    confirming = true
    error = null
    clearTimeout(timer)
    timer = setTimeout(() => { confirming = false }, 4000)
  }

  async function remove () {
    if (busy) return
    busy = true
    error = null
    try {
      const res = await fetch(`/api/configs/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        window.location.href = redirect
        return
      }
      busy = false
      confirming = false
      error = res.status === 401 ? 'Please sign in again.' : 'Could not delete. Try again.'
    } catch {
      busy = false
      error = 'Network error.'
    }
  }
</script>

<span class="wrap">
  {#if confirming}
    <button class="btn danger" type="button" onclick={remove} disabled={busy}>
      {busy ? 'Deleting…' : 'Confirm delete'}
    </button>
    <button class="btn" type="button" onclick={() => { confirming = false }} disabled={busy}>Cancel</button>
  {:else}
    <button class="btn ghost-danger" type="button" onclick={arm}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" />
      </svg>
      Delete
    </button>
  {/if}
  {#if error}<span class="err" role="alert">{error}</span>{/if}
</span>

<style>
  .wrap {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0.45rem 0.85rem;
    border-radius: var(--radius);
    border: 1px solid var(--border-2);
    background: var(--surface-2);
    color: var(--text);
    font-family: inherit;
    font-size: var(--fs-sm);
    font-weight: 500;
    cursor: pointer;
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .ghost-danger {
    background: transparent;
    color: var(--text-muted);
    border-color: var(--border-2);
  }
  .ghost-danger:hover {
    color: var(--danger);
    border-color: color-mix(in srgb, var(--danger) 55%, transparent);
  }
  .danger {
    background: color-mix(in srgb, var(--danger) 18%, transparent);
    border-color: color-mix(in srgb, var(--danger) 55%, transparent);
    color: #ff9b9b;
  }
  .err {
    font-size: var(--fs-xs);
    color: #ff8f8f;
  }
</style>
