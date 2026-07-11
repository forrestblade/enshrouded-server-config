/**
 * shared-config / lib / slug — URL-safe slugs for configs and tags.
 *
 * Config slugs get a short random suffix so titles can collide freely and the
 * slug stays stable + unguessable-ish. Tag slugs are bare (used as facet keys,
 * so they must dedupe by name). Uses Web Crypto (present in browsers + Workers).
 */
const BASE = 'config'

export function slugify (input: string): string {
  const s = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return s || BASE
}

export function randomSuffix (len = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('')
}

/** Config slug: `my-hardcore-server-a1b2c3`. */
export function buildConfigSlug (title: string): string {
  return `${slugify(title)}-${randomSuffix()}`
}

/** Tag slug: dedupe key derived from the display name. */
export function tagSlug (name: string): string {
  return slugify(name)
}
