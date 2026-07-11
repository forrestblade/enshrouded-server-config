// @ts-check
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import svelte from '@astrojs/svelte'

// https://astro.build/config
export default defineConfig({
  site: 'https://enshroudedserverconfig.com',
  output: 'server',
  server: { port: 4321 },
  // Astro's checkOrigin requires an `Origin` header on state-changing requests,
  // which some browsers omit on same-origin POST (e.g. Safari) and which the
  // Better Auth client omits on the bodyless sign-out POST -> it was silently
  // 403ing sign-out / like / delete. We disable it because CSRF is already
  // covered: Better Auth runs its own origin/referer check for /api/auth/*, and
  // our endpoints require the session cookie, which is SameSite=Lax (cross-site
  // POSTs can't carry it). Defense-in-depth: src/middleware.ts additionally
  // rejects unsafe /api/* requests whose Origin header is present + mismatched.
  security: { checkOrigin: false },
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
