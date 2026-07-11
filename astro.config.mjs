// @ts-check
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import svelte from '@astrojs/svelte'

// https://astro.build/config
export default defineConfig({
  site: 'https://enshroudedserverconfig.com',
  output: 'server',
  server: { port: 4321 },
  adapter: cloudflare({
    // adapter v14: local bindings are provided automatically by @cloudflare/vite-plugin
    // (the old `platformProxy` option was removed). Sessions auto-use a `SESSION` KV binding.
    imageService: 'compile'
  }),
  integrations: [svelte()],
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  vite: {
    ssr: {
      // Better Auth + Drizzle resolve cleanly on the Workers runtime
      external: ['node:crypto']
    }
  }
})
