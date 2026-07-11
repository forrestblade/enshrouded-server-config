/**
 * server-config — public API (Feature-Sliced Design entity barrel).
 *
 * Other slices import the Enshrouded config domain from here, never from deep
 * paths: `import { serverConfigSchema, toEnshroudedJson } from '@/entities/server-config'`.
 */
export * from './model/schema'
export * from './config/field-catalog'
export * from './lib/validate'
export * from './lib/presets'
export * from './lib/export'
