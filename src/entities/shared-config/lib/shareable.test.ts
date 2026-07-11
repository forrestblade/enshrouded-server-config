import { describe, it, expect } from 'vitest'
import { toShareableConfig } from './shareable'
import { defaultServerConfig, serverConfigSchema } from '@/entities/server-config'

describe('toShareableConfig', () => {
  it('resets host fields to schema defaults and blanks passwords', () => {
    const config = defaultServerConfig()
    config.saveDirectory = 'D:/saves'
    config.logDirectory = 'D:/logs'
    config.ip = '203.0.113.7'
    config.queryPort = 31111
    config.userGroups[0]!.password = 'hunter2'

    const shared = toShareableConfig(config)
    const defaults = defaultServerConfig()
    expect(shared.saveDirectory).toBe(defaults.saveDirectory)
    expect(shared.logDirectory).toBe(defaults.logDirectory)
    expect(shared.ip).toBe(defaults.ip)
    expect(shared.queryPort).toBe(defaults.queryPort)
    expect(shared.userGroups.every((g) => g.password === '')).toBe(true)
  })

  it('keeps everything else (fork restores the editor exactly)', () => {
    const config = defaultServerConfig()
    config.name = 'Weekend Server'
    config.slotCount = 8
    const shared = toShareableConfig(config)
    expect(shared.name).toBe('Weekend Server')
    expect(shared.slotCount).toBe(8)
  })

  it('still satisfies the full schema', () => {
    const shared = toShareableConfig(defaultServerConfig())
    expect(serverConfigSchema.safeParse(shared).success).toBe(true)
  })

  it('does not mutate the input', () => {
    const config = defaultServerConfig()
    config.userGroups[0]!.password = 'keepme'
    toShareableConfig(config)
    expect(config.userGroups[0]!.password).toBe('keepme')
  })
})
