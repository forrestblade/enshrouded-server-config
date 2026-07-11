/**
 * shared-config — public API (Feature-Sliced Design entity barrel).
 *
 * CLIENT-SAFE surface only (types, zod input schema, slug + shareable helpers).
 * The D1 repository is server-only; import it directly from
 * `@/entities/shared-config/api/repo` in API routes and `.astro` frontmatter.
 */
export * from './model/types'
export * from './lib/slug'
export * from './lib/shareable'
