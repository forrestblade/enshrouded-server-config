/**
 * shared/auth — SERVER auth public API (Feature-Sliced Design shared barrel).
 *
 * Server code imports from here: `import { createAuth } from '@/shared/auth'`.
 * This barrel pulls in Better Auth + the drizzle adapter + D1, so it must NEVER
 * be imported by client/browser code. The browser uses `@/shared/auth/client`
 * (a separate module) instead.
 */
export { createAuth, type Auth } from './server'
