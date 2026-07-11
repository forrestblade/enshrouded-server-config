import { describe, it, expect } from 'vitest'
import { slugify, randomSuffix, buildConfigSlug, tagSlug } from './slug'

describe('slugify', () => {
  it('lowercases, strips specials, and dashes whitespace', () => {
    expect(slugify('My Hardcore Server!')).toBe('my-hardcore-server')
    expect(slugify('  PvP  &  Co-op  ')).toBe('pvp-co-op')
  })

  it('collapses runs of separators', () => {
    expect(slugify('a___b   c---d')).toBe('a-b-c-d')
  })

  it('caps length at 60', () => {
    expect(slugify('x'.repeat(200)).length).toBeLessThanOrEqual(60)
  })

  it('falls back to "config" when nothing survives', () => {
    expect(slugify('!!!')).toBe('config')
    expect(slugify('')).toBe('config')
  })
})

describe('randomSuffix', () => {
  it('produces the requested length from [0-9a-z] only', () => {
    for (let i = 0; i < 50; i++) {
      const s = randomSuffix()
      expect(s).toMatch(/^[0-9a-z]{6}$/)
    }
    expect(randomSuffix(10)).toMatch(/^[0-9a-z]{10}$/)
  })

  it('does not repeat across a reasonable sample', () => {
    const seen = new Set(Array.from({ length: 200 }, () => randomSuffix()))
    expect(seen.size).toBe(200)
  })
})

describe('buildConfigSlug', () => {
  it('joins the slugified title and a 6-char suffix', () => {
    expect(buildConfigSlug('My Server')).toMatch(/^my-server-[0-9a-z]{6}$/)
  })
})

describe('tagSlug', () => {
  it('is a bare slug (dedupe key)', () => {
    expect(tagSlug('Hard Core')).toBe('hard-core')
    expect(tagSlug('PvP')).toBe('pvp')
  })
})
