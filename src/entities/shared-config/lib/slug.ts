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

const SUFFIX_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'
// Largest multiple of 36 that fits in a byte — bytes >= this are rejected so
// every character is uniform (a bare `b % 36` skews toward 0–f).
const SUFFIX_REJECT_ABOVE = 252

export function randomSuffix (len = 6): string {
  const out: string[] = []
  const buf = new Uint8Array(len * 2)
  while (out.length < len) {
    crypto.getRandomValues(buf)
    for (const b of buf) {
      if (b < SUFFIX_REJECT_ABOVE && out.length < len) out.push(SUFFIX_ALPHABET[b % 36])
    }
  }
  return out.join('')
}

/** Config slug: `my-hardcore-server-a1b2c3`. */
export function buildConfigSlug (title: string): string {
  return `${slugify(title)}-${randomSuffix()}`
}

/** Tag slug: dedupe key derived from the display name. */
export function tagSlug (name: string): string {
  return slugify(name)
}
