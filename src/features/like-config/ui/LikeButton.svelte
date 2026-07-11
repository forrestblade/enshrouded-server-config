<script lang="ts">
  // Optimistic like toggle. Server reconciles the count in the response.
  // Not signed in -> bounce to login (server knows auth state, passes `authed`).
  let {
    slug,
    count = 0,
    liked = false,
    authed = false,
  }: { slug: string, count?: number, liked?: boolean, authed?: boolean } = $props()

  let n = $state(count)
  let on = $state(liked)
  let busy = $state(false)

  async function toggle () {
    if (!authed) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/c/${slug}`)}`
      return
    }
    if (busy) return
    busy = true
    const prevOn = on
    const prevN = n
    on = !on
    n += on ? 1 : -1
    try {
      const res = await fetch(`/api/configs/${slug}/like`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as { liked: boolean, likeCount: number }
        on = data.liked
        n = data.likeCount
      } else {
        on = prevOn
        n = prevN
      }
    } catch {
      on = prevOn
      n = prevN
    }
    busy = false
  }
</script>

<button class="like" class:on type="button" onclick={toggle} aria-pressed={on} disabled={busy}
  title={authed ? (on ? 'Remove like' : 'Like this config') : 'Sign in to like'}>
  <svg viewBox="0 0 24 24" width="18" height="18" fill={on ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2 5 5.3 5c2 0 3.4 1.2 4.2 2.4C10.3 6.2 11.7 5 13.7 5 17 5 18.7 8.4 17 11.7 14.5 16.4 12 21 12 21z" />
  </svg>
  <span>{n}</span>
</button>

<style>
  .like {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0.45rem 0.85rem;
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    color: var(--text-muted);
    font-size: var(--fs-sm);
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .like:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--accent);
  }
  .like.on {
    color: var(--danger);
    border-color: color-mix(in srgb, var(--danger) 55%, transparent);
  }
  .like:disabled {
    opacity: 0.7;
    cursor: default;
  }
</style>
