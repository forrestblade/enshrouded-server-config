/**
 * session / model / types — auth session shapes surfaced on `App.Locals`.
 *
 * Minimal for now; expanded/derived from Better Auth's inferred types when auth
 * is wired (task: Better Auth). Kept here so `src/env.d.ts` has a stable import.
 */
export interface SessionUser {
  id: string
  email: string
  name: string
  image?: string | null
  username?: string | null
  createdAt: Date
}

export interface Session {
  id: string
  userId: string
  expiresAt: Date
}
