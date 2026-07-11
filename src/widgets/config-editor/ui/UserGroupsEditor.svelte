<script lang="ts">
  import type { UserGroup } from '@/entities/server-config'

  interface Props {
    groups: UserGroup[]
  }

  let { groups }: Props = $props()

  const PERMS = [
    { key: 'canKickBan', label: 'Kick / ban' },
    { key: 'canAccessInventories', label: 'Inventories' },
    { key: 'canEditBase', label: 'Edit base' },
    { key: 'canExtendBase', label: 'Extend base' },
  ] as const

  function addGroup (): void {
    groups.push({
      name: 'New group',
      password: '',
      canKickBan: false,
      canAccessInventories: false,
      canEditBase: false,
      canExtendBase: false,
      reservedSlots: 0,
    })
  }

  function removeGroup (index: number): void {
    groups.splice(index, 1)
  }
</script>

<div class="groups">
  {#each groups as group, i (i)}
    <div class="group">
      <div class="group-head">
        <input class="group-name" type="text" bind:value={group.name} placeholder="Group name" aria-label="Group name" />
        <button
          class="group-remove"
          type="button"
          onclick={() => removeGroup(i)}
          disabled={groups.length <= 1}
          aria-label="Remove group"
          title={groups.length <= 1 ? 'At least one group is required' : 'Remove group'}
        >Remove</button>
      </div>

      <input class="group-pass" type="text" bind:value={group.password} placeholder="Password (optional)" aria-label="Group password" />

      <div class="group-perms">
        {#each PERMS as p (p.key)}
          <label class="perm">
            <input type="checkbox" bind:checked={group[p.key]} />
            <span>{p.label}</span>
          </label>
        {/each}
        <label class="perm slots">
          <span>Reserved slots</span>
          <input type="number" min="0" max="16" bind:value={group.reservedSlots} />
        </label>
      </div>
    </div>
  {/each}

  <button class="group-add" type="button" onclick={addGroup}>+ Add group</button>
  <p class="groups-note">Passwords are removed automatically when a config is shared publicly.</p>
</div>

<style>
  .groups {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .group-head {
    display: flex;
    gap: var(--space-2);
  }
  .group-name {
    flex: 1;
    font-weight: 500;
  }
  input[type='text'],
  input[type='number'] {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border-2);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.55rem;
    font-size: var(--fs-sm);
  }
  input[type='text']:focus-visible,
  input[type='number']:focus-visible {
    border-color: var(--accent);
    outline: none;
  }
  .group-remove {
    background: none;
    border: 1px solid var(--border-2);
    color: var(--text-muted);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.6rem;
    font-size: var(--fs-xs);
    cursor: pointer;
  }
  .group-remove:hover:not(:disabled) {
    color: var(--danger);
    border-color: var(--danger);
  }
  .group-remove:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .group-perms {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    align-items: center;
  }
  .perm {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--fs-sm);
    color: var(--text-muted);
    cursor: pointer;
  }
  .perm input[type='checkbox'] {
    accent-color: var(--accent);
    width: 15px;
    height: 15px;
  }
  .slots {
    margin-left: auto;
  }
  .slots input {
    width: 4rem;
  }
  .group-add {
    align-self: flex-start;
    background: none;
    border: 1px dashed var(--border-2);
    color: var(--text-muted);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.7rem;
    font-size: var(--fs-sm);
    cursor: pointer;
  }
  .group-add:hover {
    color: var(--text);
    border-color: var(--accent);
  }
  .groups-note {
    font-size: var(--fs-xs);
    color: var(--text-dim);
  }
</style>
