/**
 * session / model / types — auth session shapes surfaced on `App.Locals`.
 *
 * Derived from Better Auth's inferred types (`Auth['$Infer']['Session']`) so
 * `Astro.locals.user` / `Astro.locals.session` stay in lockstep with the auth
 * config — including username-plugin fields (`username`, `displayUsername`) and
 * any future plugin/additional-field additions. Type-only import: the server
 * auth module (Better Auth + drizzle + D1) is never bundled here.
 */
import type { Auth } from '@/shared/auth'

type InferredSession = Auth['$Infer']['Session']

export type SessionUser = InferredSession['user']
export type Session = InferredSession['session']
