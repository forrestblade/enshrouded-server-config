/**
 * db/schema — Drizzle table barrel.
 *
 * The single object passed to `drizzle(env.DB, { schema })` and to
 * drizzle-kit. Better Auth's adapter reads `user/session/account/verification`
 * from here by name, so keep those exports intact.
 */
export * from './auth'
export * from './content'
