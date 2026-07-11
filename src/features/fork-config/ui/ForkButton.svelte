<script lang="ts">
  import type { ServerConfig } from '@/entities/server-config'
  import { forkIntoEditor } from '../lib/fork'

  let { config, slug }: { config: ServerConfig, slug: string } = $props()
</script>

<button class="btn" type="button" onclick={() => forkIntoEditor(config, slug)}>
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="19" r="2.5" />
    <path d="M6 8.5v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2M12 13.5v3" />
  </svg>
  Fork to editor
</button>
