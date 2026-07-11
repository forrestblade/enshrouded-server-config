/**
 * auth/client — Better Auth browser client (Svelte).
 *
 * Imported directly by Svelte islands (`@/shared/auth/client`), never via the
 * server barrel. No baseURL: the client targets the current origin, where the
 * catch-all handler is mounted at `/api/auth/*`.
 *
 * Exposes `authClient.signIn.social({ provider })`, `authClient.signOut()`,
 * `authClient.useSession()` (a Svelte store), and username methods from the
 * username client plugin.
 */
import { createAuthClient } from 'better-auth/svelte'
import { usernameClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [usernameClient()],
})

export const { signIn, signOut, useSession } = authClient
