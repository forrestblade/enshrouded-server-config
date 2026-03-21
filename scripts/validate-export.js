#!/usr/bin/env node
//
// Validates that an exported Enshrouded server config JSON file has the
// correct structure expected by the dedicated server.
//
// Usage:  node scripts/validate-export.js <path-to-exported.json>
//         node scripts/validate-export.js          (runs built-in self-test)

import { readFileSync } from 'node:fs'

// ── Expected game-settings keys (from actual Enshrouded server config) ────
const NUMERIC_KEYS = [
  'playerHealthFactor', 'playerManaFactor', 'playerStaminaFactor',
  'playerBodyHeatFactor', 'playerDivingTimeFactor',
  'foodBuffDurationFactor', 'fromHungerToStarving', 'shroudTimeFactor',
  'miningDamageFactor', 'plantGrowthSpeedFactor',
  'resourceDropStackAmountFactor', 'factoryProductionSpeedFactor',
  'perkUpgradeRecyclingFactor', 'perkCostFactor',
  'experienceCombatFactor', 'experienceMiningFactor',
  'experienceExplorationQuestsFactor',
  'enemyDamageFactor', 'enemyHealthFactor', 'enemyStaminaFactor',
  'enemyPerceptionRangeFactor', 'bossDamageFactor', 'bossHealthFactor',
  'threatBonus', 'dayTimeDuration', 'nightTimeDuration'
]

const SELECT_KEYS = {
  enableDurability: ['true', 'false'],
  enableStarvingDebuff: ['true', 'false'],
  enableGliderTurbulences: ['true', 'false'],
  tombstoneMode: ['AddBackpackMaterials', 'Everything', 'NoTombstone'],
  weatherFrequency: ['Disabled', 'Rare', 'Normal', 'Often'],
  fishingDifficulty: ['VeryEasy', 'Easy', 'Normal', 'Hard', 'VeryHard'],
  curseModifier: ['Easy', 'Normal', 'Hard'],
  randomSpawnerAmount: ['Few', 'Normal', 'Many', 'Extreme'],
  aggroPoolAmount: ['Few', 'Normal', 'Many', 'Extreme'],
  pacifyAllEnemies: ['true', 'false'],
  tamingStartleRepercussion: ['KeepProgress', 'LoseSomeProgress', 'LoseAllProgress']
}

const ALL_GAME_KEYS = [...NUMERIC_KEYS, ...Object.keys(SELECT_KEYS)]

// Nanosecond duration fields that must remain as raw numbers
const DURATION_KEYS = ['fromHungerToStarving', 'dayTimeDuration', 'nightTimeDuration']

const VALID_PRESETS = ['Default', 'Relaxed', 'Hard', 'Survival', 'Custom']

const errors = []
function fail (msg) { errors.push(msg) }

function validate (data) {
  errors.length = 0

  // ── Top-level server fields ──
  if (typeof data.name !== 'string') fail('name: expected string, got ' + typeof data.name)
  if (typeof data.saveDirectory !== 'string') fail('saveDirectory: expected string')
  if (typeof data.logDirectory !== 'string') fail('logDirectory: expected string')
  if (typeof data.ip !== 'string') fail('ip: expected string')
  if (typeof data.gamePort !== 'number') fail('gamePort: expected number, got ' + typeof data.gamePort)
  if (typeof data.queryPort !== 'number') fail('queryPort: expected number, got ' + typeof data.queryPort)
  if (typeof data.slotCount !== 'number') fail('slotCount: expected number')

  // ── Preset ──
  if (!VALID_PRESETS.includes(data.gameSettingsPreset)) {
    fail('gameSettingsPreset: invalid value "' + data.gameSettingsPreset + '"')
  }

  // ── gameSettings must be an object ──
  if (typeof data.gameSettings !== 'object' || data.gameSettings === null || Array.isArray(data.gameSettings)) {
    fail('gameSettings: expected an object, got ' + (Array.isArray(data.gameSettings) ? 'array' : typeof data.gameSettings))
  } else {
    // Check numeric keys
    for (const key of NUMERIC_KEYS) {
      if (!(key in data.gameSettings)) {
        fail('gameSettings.' + key + ': missing')
      } else if (typeof data.gameSettings[key] !== 'number') {
        fail('gameSettings.' + key + ': expected number, got ' + typeof data.gameSettings[key])
      }
    }
    // Check select keys
    for (const [key, validValues] of Object.entries(SELECT_KEYS)) {
      if (!(key in data.gameSettings)) {
        fail('gameSettings.' + key + ': missing')
      } else if (!validValues.includes(String(data.gameSettings[key]))) {
        fail('gameSettings.' + key + ': invalid value "' + data.gameSettings[key] + '", expected one of: ' + validValues.join(', '))
      }
    }
    // Duration values must be nanoseconds (large numbers, not human-readable)
    for (const key of DURATION_KEYS) {
      const v = data.gameSettings[key]
      if (typeof v === 'number' && v > 0 && v < 1000000) {
        fail('gameSettings.' + key + ': value ' + v + ' looks like minutes/seconds, expected nanoseconds')
      }
    }
  }

  // ── userGroups must be a proper array ──
  if (typeof data.userGroups === 'string') {
    fail('userGroups: got a JSON string instead of an array (double-encoding bug)')
  } else if (!Array.isArray(data.userGroups)) {
    fail('userGroups: expected array, got ' + typeof data.userGroups)
  } else {
    for (let i = 0; i < data.userGroups.length; i++) {
      const g = data.userGroups[i]
      if (typeof g !== 'object' || g === null) {
        fail('userGroups[' + i + ']: expected object, got ' + typeof g)
        continue
      }
      if (typeof g.name !== 'string') fail('userGroups[' + i + '].name: expected string')
      if (typeof g.password !== 'string') fail('userGroups[' + i + '].password: expected string')
      for (const boolKey of ['canKickBan', 'canAccessInventories', 'canEditBase', 'canExtendBase']) {
        if (typeof g[boolKey] !== 'boolean') {
          fail('userGroups[' + i + '].' + boolKey + ': expected boolean, got ' + typeof g[boolKey])
        }
      }
    }
  }

  return errors
}

// ── Self-test ─────────────────────────────────────────────
function selfTest () {
  console.log('Running self-tests...\n')
  let passed = 0
  let failed = 0

  function assert (label, errs, expectPass) {
    const ok = expectPass ? errs.length === 0 : errs.length > 0
    if (ok) {
      console.log('  PASS: ' + label)
      passed++
    } else {
      console.log('  FAIL: ' + label)
      if (expectPass) errs.forEach(e => console.log('    - ' + e))
      else console.log('    Expected errors but got none')
      failed++
    }
  }

  const validGameSettings = {
    playerHealthFactor: 1, playerManaFactor: 1, playerStaminaFactor: 1,
    playerBodyHeatFactor: 1, playerDivingTimeFactor: 1,
    enableDurability: 'true', enableStarvingDebuff: 'false', enableGliderTurbulences: 'true',
    foodBuffDurationFactor: 1, fromHungerToStarving: 600000000000,
    shroudTimeFactor: 1, tombstoneMode: 'AddBackpackMaterials',
    miningDamageFactor: 1, plantGrowthSpeedFactor: 1,
    resourceDropStackAmountFactor: 1, factoryProductionSpeedFactor: 1,
    perkUpgradeRecyclingFactor: 0.5, perkCostFactor: 1,
    experienceCombatFactor: 1, experienceMiningFactor: 1,
    experienceExplorationQuestsFactor: 1,
    weatherFrequency: 'Normal', fishingDifficulty: 'Normal', curseModifier: 'Normal',
    randomSpawnerAmount: 'Normal', aggroPoolAmount: 'Normal',
    enemyDamageFactor: 1, enemyHealthFactor: 1, enemyStaminaFactor: 1,
    enemyPerceptionRangeFactor: 1, pacifyAllEnemies: 'false',
    tamingStartleRepercussion: 'LoseSomeProgress',
    bossDamageFactor: 1, bossHealthFactor: 1, threatBonus: 1,
    dayTimeDuration: 1800000000000, nightTimeDuration: 720000000000
  }

  const validExport = {
    name: 'Test Server', saveDirectory: './savegame', logDirectory: './logs',
    ip: '0.0.0.0', gamePort: 15636, queryPort: 15637, slotCount: 16,
    gameSettingsPreset: 'Default', gameSettings: validGameSettings,
    userGroups: [
      { name: 'Admin', password: '', canKickBan: true, canAccessInventories: true, canEditBase: true, canExtendBase: true, reservedSlots: 0 },
      { name: 'Default', password: '', canKickBan: false, canAccessInventories: false, canEditBase: false, canExtendBase: false, reservedSlots: 0 }
    ]
  }
  assert('valid export passes', validate(validExport), true)

  const doubleEncoded = { ...validExport, userGroups: JSON.stringify(validExport.userGroups) }
  assert('double-encoded userGroups detected', validate(doubleEncoded), false)

  const noGameSettings = { ...validExport }
  delete noGameSettings.gameSettings
  assert('missing gameSettings detected', validate(noGameSettings), false)

  const humanDuration = {
    ...validExport,
    gameSettings: { ...validExport.gameSettings, dayTimeDuration: 30 }
  }
  assert('human-readable duration detected', validate(humanDuration), false)

  const noGamePort = { ...validExport }
  delete noGamePort.gamePort
  assert('missing gamePort detected', validate(noGamePort), false)

  console.log('\n' + passed + ' passed, ' + failed + ' failed')
  process.exit(failed > 0 ? 1 : 0)
}

// ── CLI entry point ───────────────────────────────────────
const filePath = process.argv[2]

if (!filePath) {
  selfTest()
} else {
  let data
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (err) {
    console.error('Failed to read/parse ' + filePath + ': ' + err.message)
    process.exit(1)
  }

  const errs = validate(data)
  if (errs.length === 0) {
    console.log('VALID: Export JSON matches Enshrouded dedicated server format.')
  } else {
    console.error('INVALID: Found ' + errs.length + ' issue(s):')
    errs.forEach(e => console.error('  - ' + e))
    process.exit(1)
  }
}
