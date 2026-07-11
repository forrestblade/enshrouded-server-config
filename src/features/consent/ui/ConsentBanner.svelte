<script lang="ts">
  import { onMount } from 'svelte'
  import { readConsent, writeConsent, type ConsentState } from '../lib/consent'

  let state = $state<ConsentState>('unset')
  let open = $state(false)

  onMount(() => {
    state = readConsent()
    if (state === 'unset') open = true
  })

  function decide (decision: 'granted' | 'denied'): void {
    writeConsent(decision)
    state = decision
    open = false
  }
</script>

<div class="consent">
  {#if open}
    <div class="panel" role="dialog" aria-label="Privacy choices">
      <p class="panel-title">Privacy</p>
      <p class="panel-text">
        Nothing is collected until you allow it. If you accept, this site records privacy-friendly,
        first-party usage stats at the edge. No third-party trackers and no ads.
      </p>
      <div class="panel-actions">
        <button class="btn btn-primary" type="button" onclick={() => decide('granted')}>Accept all</button>
        <button class="btn" type="button" onclick={() => decide('denied')}>Reject all</button>
      </div>
      {#if state !== 'unset'}
        <p class="panel-state">Currently {state === 'granted' ? 'accepted' : 'rejected'}.</p>
      {/if}
    </div>
  {/if}

  <button
    class="cookie"
    class:granted={state === 'granted'}
    type="button"
    onclick={() => { open = !open }}
    aria-label="Privacy choices"
    aria-expanded={open}
    title="Privacy choices"
  >
    <svg width="24" height="24" viewBox="0 0 49 49" fill="currentColor" aria-hidden="true">
      <path d="M20.5417 19.3951C22.5437 19.3951 24.1667 17.7721 24.1667 15.7701C24.1667 13.768 22.5437 12.1451 20.5417 12.1451C18.5396 12.1451 16.9167 13.768 16.9167 15.7701C16.9167 17.7721 18.5396 19.3951 20.5417 19.3951Z" />
      <path d="M15.7083 31.4784C17.7104 31.4784 19.3333 29.8554 19.3333 27.8534C19.3333 25.8514 17.7104 24.2284 15.7083 24.2284C13.7063 24.2284 12.0833 25.8514 12.0833 27.8534C12.0833 29.8554 13.7063 31.4784 15.7083 31.4784Z" />
      <path d="M31.4167 33.8951C32.7514 33.8951 33.8333 32.8131 33.8333 31.4784C33.8333 30.1437 32.7514 29.0617 31.4167 29.0617C30.082 29.0617 29 30.1437 29 31.4784C29 32.8131 30.082 33.8951 31.4167 33.8951Z" />
      <path d="M48.2125 21.7876C43.8867 21.7151 39.2708 17.0751 41.7358 11.5892C34.5583 14.0059 27.7675 7.74674 29.1933 0.569244C12.3492 -2.98326 0 10.7192 0 24.2284C0 37.5684 10.8267 48.3951 24.1667 48.3951C38.4008 48.3951 49.6383 36.1184 48.2125 21.7876ZM24.1667 43.5617C13.5092 43.5617 4.83333 34.8859 4.83333 24.2284C4.83333 16.2292 11.4308 4.46008 24.36 4.84674C25.375 10.9851 30.2567 15.8667 36.4192 16.7851C36.5883 17.6551 37.6758 22.9476 43.4758 25.5576C42.775 35.9734 33.9783 43.5617 24.1667 43.5617Z" />
    </svg>
  </button>
</div>

<style>
  .consent {
    position: fixed;
    left: var(--space-4);
    bottom: var(--space-4);
    z-index: 60;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .cookie {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    color: var(--text-muted);
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }
  .cookie:hover {
    color: var(--text);
    transform: translateY(-1px);
  }
  .cookie.granted {
    color: var(--accent);
    border-color: var(--accent);
  }

  .panel {
    width: min(340px, calc(100vw - 2 * var(--space-4)));
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }
  .panel-title {
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: var(--fs-sm);
    color: var(--text);
  }
  .panel-text {
    margin-top: var(--space-2);
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .panel-actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }
  .panel-state {
    margin-top: var(--space-3);
    font-size: var(--fs-xs);
    color: var(--text-dim);
  }

  @media (max-width: 640px) {
    .consent {
      bottom: calc(62px + var(--space-3));
    }
  }
</style>
