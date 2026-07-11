<script lang="ts">
  // Set/change the public username. Social sign-up doesn't assign one, so a
  // user needs this before their /u/[username] profile works.
  import { authClient } from '@/shared/auth/client'

  let { current = '' }: { current?: string } = $props()

  // Intentional initial-value capture: the field is seeded from the server-
  // rendered username and owned by the user's typing afterwards.
  // svelte-ignore state_referenced_locally
  let value = $state(current)
  let status = $state<'idle' | 'checking' | 'saving' | 'saved' | 'error'>('idle')
  let message = $state<string | null>(null)

  const cleaned = $derived(value.trim().toLowerCase())
  const valid = $derived(/^[a-z0-9_]{3,20}$/.test(cleaned))

  async function check () {
    if (!valid || cleaned === current) return
    status = 'checking'
    message = null
    try {
      const res = await authClient.isUsernameAvailable({ username: cleaned })
      if (res.data && res.data.available === false) {
        status = 'error'
        message = 'That username is taken.'
      } else {
        status = 'idle'
      }
    } catch {
      status = 'idle'
    }
  }

  async function save (e: Event) {
    e.preventDefault()
    if (!valid) {
      status = 'error'
      message = 'Use 3–20 characters: letters, numbers, or underscore.'
      return
    }
    status = 'saving'
    message = null
    const res = await authClient.updateUser({ username: cleaned, displayUsername: value.trim() })
    if (res.error) {
      status = 'error'
      message = res.error.message ?? 'Could not save username.'
      return
    }
    status = 'saved'
    message = 'Saved.'
    window.location.reload()
  }
</script>

<form class="username-form" onsubmit={save}>
  <label for="username">{current ? 'Change username' : 'Choose a username'}</label>
  <div class="row">
    <span class="prefix">/u/</span>
    <input
      id="username"
      type="text"
      bind:value
      onblur={check}
      placeholder="your_name"
      autocomplete="off"
      spellcheck="false"
      class:invalid={status === 'error'}
    />
    <button class="btn btn-primary" type="submit" disabled={status === 'saving' || !valid}>
      {status === 'saving' ? 'Saving…' : 'Save'}
    </button>
  </div>
  {#if message}
    <p class="msg" class:ok={status === 'saved'} class:err={status === 'error'}>{message}</p>
  {:else}
    <p class="hint">3–20 characters: lowercase letters, numbers, underscore.</p>
  {/if}
</form>

<style>
  .username-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-width: 420px;
  }
  label {
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .prefix {
    color: var(--text-dim);
    font-size: var(--fs-sm);
  }
  input {
    flex: 1;
    padding: 0.5rem 0.7rem;
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    color: var(--text);
    font-family: inherit;
    font-size: var(--fs-base);
  }
  input:focus {
    outline: none;
    border-color: var(--accent);
  }
  input.invalid {
    border-color: #d66;
  }
  .hint {
    font-size: var(--fs-xs);
    color: var(--text-dim);
  }
  .msg {
    font-size: var(--fs-sm);
  }
  .msg.ok {
    color: #7bd88f;
  }
  .msg.err {
    color: #ff8f8f;
  }
</style>
