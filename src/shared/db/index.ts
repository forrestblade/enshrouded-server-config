/**
 * shared/db — public API (Feature-Sliced Design shared barrel).
 *
 * Slices import the database from here, never from deep paths:
 *   import { getDb, serverConfig, type Db } from '@/shared/db'
 */
export { getDb, type Db } from './client'
export * as schema from './schema'
export * from './schema'
