// @ts-check
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import svelte from '@astrojs/svelte'

// https://astro.build/config
export default defineConfig({
  site: 'https://enshroudedserverconfig.com',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
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
