import { describe, it, expect } from 'vitest'
import {
  serverConfigSchema,
  gameSettingsSchema,
  defaultServerConfig,
  defaultGameSettings,
  GAME_NUMERIC_FIELDS,
  NS_PER_MINUTE,
  nsToMinutes,
  minutesToNs,
  type NumericFieldSpec,
} from './schema'

const numericFields = Object.entries(GAME_NUMERIC_FIELDS) as Array<[string, NumericFieldSpec]>

describe('serverConfigSchema', () => {
  it('parses an empty object into a fully-defaulted, valid config', () => {
    const config = serverConfigSchema.parse({})
    expect(config.name).toBe('Enshrouded Server')
    expect(config.slotCount).toBe(16)
    expect(config.gameSettingsPreset).toBe('Default')
    expect(config.userGroups.length).toBeGreaterThan(0)
  })

  it('round-trips its own defaults', () => {
    const config = defaultServerConfig()
    expect(() => serverConfigSchema.parse(config)).not.toThrow()
  })

  it('rejects unknown top-level keys (strict)', () => {
    const result = serverConfigSchema.safeParse({ ...defaultServerConfig(), bogusKey: 1 })
    expect(result.success).toBe(false)
  })

  it('rejects out-of-range slotCount', () => {
    expect(serverConfigSchema.safeParse({ slotCount: 0 }).success).toBe(false)
    expect(serverConfigSchema.safeParse({ slotCount: 17 }).success).toBe(false)
  })

  it('rejects an invalid enum value', () => {
    expect(serverConfigSchema.safeParse({ voiceChatMode: 'Whisper' }).success).toBe(false)
  })
})

describe('gameSettingsSchema', () => {
  it('rejects unknown gameSettings keys (strict — the silent-wipe guard)', () => {
    const result = gameSettingsSchema.safeParse({ ...defaultGameSettings(), notAField: 1 })
    expect(result.success).toBe(false)
  })

  it('enforces min/max for every numeric field in the catalog', () => {
    for (const [key, spec] of numericFields) {
      const below = gameSettingsSchema.safeParse({ [key]: spec.min - (spec.integer ? 1 : 0.01) })
      const above = gameSettingsSchema.safeParse({ [key]: spec.max + (spec.integer ? 1 : 0.01) })
      const atMin = gameSettingsSchema.safeParse({ [key]: spec.min })
      const atMax = gameSettingsSchema.safeParse({ [key]: spec.max })
      expect(below.success, `${key} below min should fail`).toBe(false)
      expect(above.success, `${key} above max should fail`).toBe(false)
      expect(atMin.success, `${key} at min should pass`).toBe(true)
      expect(atMax.success, `${key} at max should pass`).toBe(true)
    }
  })

  it('requires integers for duration fields', () => {
    const result = gameSettingsSchema.safeParse({ dayTimeDuration: 30 * NS_PER_MINUTE + 0.5 })
    expect(result.success).toBe(false)
  })

  it('defaults every field in the catalog to its spec default', () => {
    const settings = defaultGameSettings() as unknown as Record<string, unknown>
    for (const [key, spec] of numericFields) {
      expect(settings[key], key).toBe(spec.default)
    }
  })
})

describe('duration helpers', () => {
  it('converts ns to minutes and back losslessly for whole minutes', () => {
    expect(nsToMinutes(30 * NS_PER_MINUTE)).toBe(30)
    expect(minutesToNs(12)).toBe(12 * NS_PER_MINUTE)
    expect(nsToMinutes(minutesToNs(45))).toBe(45)
  })
})
