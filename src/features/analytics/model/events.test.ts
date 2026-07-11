import { describe, it, expect } from 'vitest'
import { toDataLayerParams, ANALYTICS_EVENTS } from './events'

describe('ANALYTICS_EVENTS', () => {
  it('uses snake_case-safe names (GA4 convention)', () => {
    for (const name of ANALYTICS_EVENTS) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/)
    }
  })
})

describe('toDataLayerParams', () => {
  it('maps typed params to snake_case dataLayer keys', () => {
    expect(toDataLayerParams({ configSlug: 'my-slug', visibility: 'public', likeState: 'on' }))
      .toEqual({ config_slug: 'my-slug', visibility: 'public', like_state: 'on' })
  })

  it('drops absent params instead of sending empty keys', () => {
    expect(toDataLayerParams({})).toEqual({})
    expect(toDataLayerParams({ configSlug: 'x' })).toEqual({ config_slug: 'x' })
  })

  it('truncates oversized values (PII/abuse guard)', () => {
    const out = toDataLayerParams({ configSlug: 'a'.repeat(500), visibility: 'b'.repeat(500), likeState: 'c'.repeat(500) })
    expect(out.config_slug!.length).toBe(128)
    expect(out.visibility!.length).toBe(32)
    expect(out.like_state!.length).toBe(8)
  })
})
