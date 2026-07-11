<script lang="ts">
  // Headless island: mounts the consent-gated tracker exactly once. Rendered by
  // the Layout as `<AnalyticsTracker client:idle gtmId={...} ga4Id={...} />`.
  // Renders no DOM.
  import { onMount } from 'svelte'
  import { initAnalytics } from '../lib/init'

  let { gtmId = '', ga4Id = '' }: { gtmId?: string, ga4Id?: string } = $props()

  onMount(() => {
    initAnalytics({ gtmId, ga4Id })
  })
</script>
