import { describe, it, expect } from 'vitest'
import { toEnshroudedJson, toEnshroudedJsonResult, stringifyEnshroudedJson } from './export'
import { defaultServerConfig } from '../model/schema'
import type { ServerConfig } from '../model/schema'

function customConfig (): ServerConfig {
  const config = defaultServerConfig()
  config.gameSettingsPreset = 'Custom'
  config.gameSettings.playerHealthFactor = 1.23456
  config.userGroups[0]!.password = 'hunter2'
  config.ip = '203.0.113.7'
  config.queryPort = 12345
  config.saveDirectory = 'D:/saves'
  config.logDirectory = 'D:/logs'
  return config
}

describe('toEnshroudedJson', () => {
  it('emits gameSettings: {} for a named preset', () => {
    const config = defaultServerConfig()
    config.gameSettingsPreset = 'Hard'
    const json = toEnshroudedJson(config)
    expect(json.gameSettings).toEqual({})
  })

  it('emits the full gameSettings block for Custom', () => {
    const json = toEnshroudedJson(customConfig())
    expect(Object.keys(json.gameSettings).length).toBeGreaterThan(30)
  })

  it('rounds float factors to 2 decimals but leaves ns durations alone', () => {
    const config = customConfig()
    const json = toEnshroudedJson(config)
    const settings = json.gameSettings as Record<string, number>
    expect(settings.playerHealthFactor).toBe(1.23)
    expect(settings.dayTimeDuration).toBe(config.gameSettings.dayTimeDuration)
  })

  it('public mode strips host fields and blanks passwords', () => {
    const json = toEnshroudedJson(customConfig(), { public: true })
    expect(json.saveDirectory).toBeUndefined()
    expect(json.logDirectory).toBeUndefined()
    expect(json.ip).toBeUndefined()
    expect(json.queryPort).toBeUndefined()
    expect(json.userGroups.every((g) => g.password === '')).toBe(true)
  })

  it('non-public mode keeps host fields and passwords', () => {
    const json = toEnshroudedJson(customConfig())
    expect(json.ip).toBe('203.0.113.7')
    expect(json.queryPort).toBe(12345)
    expect(json.userGroups[0]!.password).toBe('hunter2')
  })

  it('does not mutate the input config', () => {
    const config = customConfig()
    toEnshroudedJson(config, { public: true })
    expect(config.userGroups[0]!.password).toBe('hunter2')
    expect(config.ip).toBe('203.0.113.7')
  })
})

describe('toEnshroudedJsonResult', () => {
  it('returns Ok for a valid unknown input', () => {
    expect(toEnshroudedJsonResult(defaultServerConfig()).isOk()).toBe(true)
  })

  it('returns Err (not a throw) for garbage input', () => {
    expect(toEnshroudedJsonResult({ slotCount: 'lots' }).isErr()).toBe(true)
  })
})

describe('stringifyEnshroudedJson', () => {
  it('produces strict, parseable JSON with a trailing newline', () => {
    const text = stringifyEnshroudedJson(defaultServerConfig())
    expect(text.endsWith('\n')).toBe(true)
    expect(() => JSON.parse(text)).not.toThrow()
  })
})
