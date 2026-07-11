import { describe, it, expect } from 'vitest'
import { PRESET_TEMPLATES, buildTemplateSettings, getPresetTemplate } from './presets'
import { gameSettingsSchema, GAME_NUMERIC_FIELDS } from '../model/schema'

describe('PRESET_TEMPLATES', () => {
  it('has unique ids', () => {
    const ids = PRESET_TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // The guarantee the presets docblock promises: a template can never produce
  // an out-of-range (invalid) export.
  it.each(PRESET_TEMPLATES.map((t) => [t.id, t] as const))(
    'template "%s" builds valid gameSettings within schema ranges',
    (_id, template) => {
      expect(() => buildTemplateSettings(template)).not.toThrow()
    }
  )

  it.each(PRESET_TEMPLATES.map((t) => [t.id, t] as const))(
    'template "%s" only overrides keys that exist in the schema',
    (_id, template) => {
      const valid = new Set(Object.keys(gameSettingsSchema.parse({})))
      for (const key of Object.keys(template.settings)) {
        expect(valid.has(key), `unknown gameSettings key: ${key}`).toBe(true)
      }
    }
  )

  it.each(PRESET_TEMPLATES.map((t) => [t.id, t] as const))(
    'template "%s" numeric overrides stay inside the field catalog bounds',
    (_id, template) => {
      for (const [key, value] of Object.entries(template.settings)) {
        const spec = GAME_NUMERIC_FIELDS[key as keyof typeof GAME_NUMERIC_FIELDS]
        if (spec && typeof value === 'number') {
          expect(value, `${key} >= min`).toBeGreaterThanOrEqual(spec.min)
          expect(value, `${key} <= max`).toBeLessThanOrEqual(spec.max)
        }
      }
    }
  )
})

describe('getPresetTemplate', () => {
  it('finds templates by id and returns undefined for unknown ids', () => {
    expect(getPresetTemplate(PRESET_TEMPLATES[0]!.id)).toBe(PRESET_TEMPLATES[0])
    expect(getPresetTemplate('nope')).toBeUndefined()
  })
})
