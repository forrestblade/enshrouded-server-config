/**
 * auth/server — Better Auth instance factory (server-only).
 *
 * On Cloudflare the D1 binding lives on the per-request runtime env, so auth is
 * built PER REQUEST from `locals.runtime.env`, never as a module singleton.
 * Call sites: the catch-all handler (`/api/auth/[...all]`) and the middleware.
 *
 * OAuth-only, passwordless (no email provider). Discord + Google at launch.
 * Account linking is on and trusts both providers (matched on the providers'
 * verified emails, server-side — no mail sent). Usernames come from the
 * username plugin (see `user.username` / `user.displayUsername` in the schema).
 *
 * Schema was hand-written + verified against getAuthTables (see
 * `@/shared/db/schema/auth`); if you add plugins/providers that need columns,
 * re-run `npx @better-auth/cli generate` and diff, then add a migration.
 */
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { username } from 'better-auth/plugins'
import { getDb, user, session, account, verification } from '@/shared/db'

export function createAuth (env: CloudflareEnv) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(env.DB), {
      provider: 'sqlite',
      // Table names are singular and match Better Auth's model names, so the
      // adapter resolves them directly (no usePlural / mapping needed).
      schema: { user, session, account, verification },
    }),
    // OAuth-only: no email/password surface is enabled.
    socialProviders: {
      discord: {
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['discord', 'google'],
      },
    },
    plugins: [username()],
  })
}

export type Auth = ReturnType<typeof createAuth>
