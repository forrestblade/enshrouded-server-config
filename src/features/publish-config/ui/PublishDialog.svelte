<script lang="ts">
  // Publish the current editor config to the browse gallery. Session-gated
  // (bounces to /login). Secrets are stripped server-side. On success -> /c/[slug].
  import type { ServerConfig } from '@/entities/server-config'
  import { FORKED_FROM_KEY } from '@/shared/config/keys'

  // `authed` is resolved server-side and passed down, so the gate is reliable
  // (no dependency on the async client session store).
  let { config, valid, authed = false }: { config: ServerConfig, valid: boolean, authed?: boolean } = $props()

  let open = $state(false)
  let title = $state('')
  let summary = $state('')
  let tagsRaw = $state('')
  let visibility = $state<'public' | 'unlisted' | 'private'>('public')
  let submitting = $state(false)
  let error = $state<string | null>(null)

  const titleOk = $derived(title.trim().length >= 3 && title.trim().length <= 120)

  function start () {
    if (!authed) {
      window.location.href = '/login?redirect=/editor'
      return
    }
    title = config.name
    summary = ''
    tagsRaw = ''
    visibility = 'public'
    error = null
    open = true
  }

  function parseTags (raw: string): string[] {
    const seen = new Set<string>()
    const out: string[] = []
    for (const part of raw.split(/[,\n]/)) {
      const t = part.trim()
      if (t && !seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase())
        out.push(t)
      }
      if (out.length >= 8) break
    }
    return out
  }

  async function submit (e: Event) {
    e.preventDefault()
    if (submitting || !titleOk) return
    error = null
    submitting = true

    let forkedFromSlug: string | undefined
    try { forkedFromSlug = localStorage.getItem(FORKED_FROM_KEY) ?? undefined } catch { /* ignore */ }

    try {
      const res = await fetch('/api/configs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          tags: parseTags(tagsRaw),
          visibility,
          config,
          forkedFromSlug,
        }),
      })
      if (res.status === 201) {
        const data = await res.json() as { slug: string }
        try { localStorage.removeItem(FORKED_FROM_KEY) } catch { /* ignore */ }
        window.location.href = `/c/${data.slug}`
        return
      }
      submitting = false
      if (res.status === 401) {
        window.location.href = '/login?redirect=/editor'
        return
      }
      error = res.status === 422
        ? 'Check the title (3–120 characters) and tags (up to 8).'
        : 'Could not publish. Please try again.'
    } catch {
      submitting = false
      error = 'Network error. Please try again.'
    }
  }
</script>

<button
  class="btn btn-primary"
  type="button"
  onclick={start}
  disabled={!valid}
  title={valid ? 'Publish to the gallery' : 'Fix invalid settings before publishing'}
>
  Publish
</button>

{#if open}
  <div class="overlay" role="presentation" onclick={() => { if (!submitting) open = false }}>
    <form class="modal" role="dialog" aria-label="Publish config" onsubmit={submit} onclick={(e) => e.stopPropagation()}>
      <h2>Publish config</h2>
      <p class="modal-sub">Shared publicly in the browse gallery. Passwords and host fields are removed automatically.</p>

      {#if error}<p class="modal-error" role="alert">{error}</p>{/if}

      <label class="field">
        <span>Title</span>
        <input type="text" bind:value={title} maxlength="120" placeholder="e.g. Hardcore survival, no tombstone" required />
      </label>

      <label class="field">
        <span>Summary <em>(optional)</em></span>
        <textarea bind:value={summary} maxlength="300" rows="2" placeholder="One line on who this is for."></textarea>
      </label>

      <label class="field">
        <span>Tags <em>(optional, comma-separated)</em></span>
        <input type="text" bind:value={tagsRaw} placeholder="hardcore, pvp, coop" />
      </label>

      <label class="field">
        <span>Visibility</span>
        <select bind:value={visibility}>
          <option value="public">Public — listed in browse</option>
          <option value="unlisted">Unlisted — only people with the link</option>
          <option value="private">Private — only you</option>
        </select>
      </label>

      <div class="modal-actions">
        <button class="btn" type="button" onclick={() => { open = false }} disabled={submitting}>Cancel</button>
        <button class="btn btn-primary" type="submit" disabled={submitting || !titleOk}>
          {submitting ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 80;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(3px);
    display: grid;
    place-items: center;
    padding: var(--space-4);
  }
  .modal {
    width: min(480px, 100%);
    max-height: 90dvh;
    overflow: auto;
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.6);
  }
  .modal h2 {
    font-size: var(--fs-xl);
  }
  .modal-sub {
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .modal-error {
    padding: var(--space-2) var(--space-3);
    border: 1px solid #6b2b2b;
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, #d66 12%, transparent);
    color: #ff9b9b;
    font-size: var(--fs-sm);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .field em {
    color: var(--text-dim);
    font-style: normal;
  }
  .field input,
  .field textarea,
  .field select {
    background: var(--surface-2);
    color: var(--text);
    border: 1px solid var(--border-2);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.6rem;
    font-family: inherit;
    font-size: var(--fs-base);
    resize: vertical;
  }
  .field input:focus,
  .field textarea:focus,
  .field select:focus {
    outline: none;
    border-color: var(--accent);
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
</style>
