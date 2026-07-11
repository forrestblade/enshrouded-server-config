<script lang="ts">
  // OAuth sign-in (Discord + Google). Passwordless, no email surface.
  // On click we hand off to the provider; Better Auth returns to `callbackURL`.
  import { signIn } from '@/shared/auth/client'

  let { redirect = '/account' }: { redirect?: string } = $props()

  let loading = $state<null | 'discord' | 'google'>(null)
  let error = $state<string | null>(null)

  async function go (provider: 'discord' | 'google') {
    error = null
    loading = provider
    const res = await signIn.social({
      provider,
      callbackURL: redirect,
      errorCallbackURL: '/login?error=oauth',
    })
    // If the client returned instead of redirecting, surface the error.
    if (res?.error) {
      loading = null
      error = res.error.message ?? 'Sign-in failed. Please try again.'
    }
  }
</script>

<div class="signin">
  {#if error}
    <p class="signin-error" role="alert">{error}</p>
  {/if}

  <button class="provider provider-discord" onclick={() => go('discord')} disabled={loading !== null}>
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M20.3 4.4A19.8 19.8 0 0015.4 3l-.3.5a18.3 18.3 0 015.5 2.7 15.8 15.8 0 00-13.2 0A18.3 18.3 0 018.9 3.5L8.6 3a19.8 19.8 0 00-4.9 1.4C.6 9 0 13.6.3 18.1A19.9 19.9 0 006.4 21l.4-.6c-1-.4-2-.9-2.9-1.5l.7-.5a14.2 14.2 0 0012.8 0l.7.5c-.9.6-1.9 1.1-2.9 1.5l.4.6a19.9 19.9 0 006.1-2.9c.4-5.3-.6-9.9-3.4-13.7zM8.5 15.3c-1.2 0-2.2-1.1-2.2-2.4S7.3 10.5 8.5 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm7 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z" />
    </svg>
    <span>{loading === 'discord' ? 'Redirecting…' : 'Continue with Discord'}</span>
  </button>

  <button class="provider provider-google" onclick={() => go('google')} disabled={loading !== null}>
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 01-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
      <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0012 24z" />
      <path fill="#FBBC05" d="M5.6 14.7a6.8 6.8 0 010-4.4v-3H1.8a11.5 11.5 0 000 10.4l3.8-3z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 001.8 6.9l3.8 3c.9-2.7 3.4-4.7 6.4-4.7z" />
    </svg>
    <span>{loading === 'google' ? 'Redirecting…' : 'Continue with Google'}</span>
  </button>
</div>

<style>
  .signin {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-width: 340px;
  }
  .signin-error {
    color: #ff8f8f;
    font-size: var(--fs-sm);
  }
  .provider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: 0.75rem var(--space-4);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--text);
    font-family: inherit;
    font-size: var(--fs-base);
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
  }
  .provider:hover:not(:disabled) {
    border-color: var(--accent);
    transform: translateY(-1px);
  }
  .provider:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .provider-discord svg {
    color: #7289da;
  }
</style>
