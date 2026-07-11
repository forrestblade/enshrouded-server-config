import { describe, it, expect } from 'vitest'
import { highlightJson } from './index'

describe('highlightJson', () => {
  it('HTML-escapes before wrapping (set:html safety)', () => {
    const out = highlightJson('{"name": "<script>alert(1)</script>"}')
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;script&gt;')
  })

  it('escapes ampersands', () => {
    const out = highlightJson('{"name": "a & b"}')
    expect(out).toContain('a &amp; b')
  })

  it('classifies keys, strings, numbers, booleans, and null', () => {
    const out = highlightJson('{"k": "v", "n": 1.5, "b": true, "z": null}')
    expect(out).toContain('class="t-key"')
    expect(out).toContain('class="t-str"')
    expect(out).toContain('class="t-num"')
    expect(out).toContain('class="t-bool"')
    expect(out).toContain('class="t-null"')
  })

  it('treats a quoted value followed by a colon as a key, not a string', () => {
    const out = highlightJson('{"name": "value"}')
    expect(out).toMatch(/t-key[^<]*>"name":/)
    expect(out).toMatch(/t-str[^<]*>"value"/)
  })
})
