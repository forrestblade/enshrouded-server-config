/**
 * Validates that the client-side export logic produces JSON matching
 * the Enshrouded dedicated server config format.
 *
 * Run: node scripts/validate-export.js
 */

// ── Inline copies of preset data (same as public/js/presets.js) ────
const base = {
  playerHealthFactor: 1, playerManaFactor: 1, playerStaminaFactor: 1,
  playerBodyHeatFactor: 1, enableDurability: 1, enableStarvingDebuff: 1,
  foodBuffDurationFactor: 1, fromHungerToStarving: 600000000000,
  shroudTimeFactor: 1, tombstoneMode: 0, miningDamageFactor: 1,
  plantGrowthSpeedFactor: 1, resourceDropStackAmountFactor: 1,
  factoryProductionSpeedFactor: 1, perkUpgradeRecyclingFactor: 0.5,
  perkCostFactor: 1, experienceCombatFactor: 1, experienceMiningFactor: 1,
  experienceExplorationQuestsFactor: 1, aggroPoolAmount: 1,
  enemyDamageFactor: 1, enemyHealthFactor: 1, enemyStaminaFactor: 1,
  enemyPerceptionRangeFactor: 1, bossDamageFactor: 1, bossHealthFactor: 1,
  threatBonusFactor: 1, pacifiedEnemies: 0, dayTimeDuration: 1800000000000,
  nightTimeDuration: 720000000000, waterOfTheWakeMode: 0, waterOfTheWakeDistance: 100
}

const presets = {
  Default: { ...base },
  Relaxed: {
    ...base,
    playerHealthFactor: 2, playerManaFactor: 2, playerStaminaFactor: 2,
    enableDurability: 0, enableStarvingDebuff: 0, foodBuffDurationFactor: 2,
    shroudTimeFactor: 2, miningDamageFactor: 2, plantGrowthSpeedFactor: 2,
    resourceDropStackAmountFactor: 2, factoryProductionSpeedFactor: 2,
    experienceCombatFactor: 2, experienceMiningFactor: 2,
    experienceExplorationQuestsFactor: 2, enemyDamageFactor: 0.5,
    enemyHealthFactor: 0.5, enemyStaminaFactor: 0.5,
    bossDamageFactor: 0.5, bossHealthFactor: 0.5
  }
}

const defaultUserGroups = [
  { name: 'Admin', password: '', canKickBan: true, canAccessInventories: true, canEditBase: true, canExtendBase: true, reservedSlots: 0 },
  { name: 'Default', password: '', canKickBan: false, canAccessInventories: false, canEditBase: false, canExtendBase: false, reservedSlots: 0 }
]

// ── Required top-level keys in the Enshrouded server JSON format ───
const REQUIRED_SERVER_KEYS = [
  'name', 'saveDirectory', 'logDirectory', 'ip', 'queryPort', 'slotCount',
  'voiceChatMode', 'enableVoiceChat', 'enableTextChat',
  'gameSettingsPreset', 'userGroups'
]

// Keys that must NOT appear (known past bugs)
const FORBIDDEN_KEYS = ['gamePort', 'gameSettings']

// All game settings keys (should appear at top level when preset is Custom)
const GAME_SETTINGS_KEYS = Object.keys(base)

let passed = 0
let failed = 0

function assert (condition, message) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error('  FAIL: ' + message)
  }
}

// ── Simulate browse-detail.js export logic (post-fix) ──────────────
function simulateBrowseDetailExport (config) {
  const exportGroups = typeof config.userGroups === 'string'
    ? JSON.parse(config.userGroups)
    : (config.userGroups || [])
  return {
    name: config.server?.serverName || config.name,
    saveDirectory: config.server?.saveDirectory || './savegame',
    logDirectory: config.server?.logDirectory || './logs',
    ip: config.server?.ip || '0.0.0.0',
    queryPort: config.server?.queryPort || 15637,
    slotCount: config.server?.slotCount || 16,
    voiceChatMode: config.server?.voiceChatMode || 'Proximity',
    enableVoiceChat: config.server?.enableVoiceChat ?? true,
    enableTextChat: config.server?.enableTextChat ?? true,
    gameSettingsPreset: config.gameSettingsPreset || 'Default',
    ...(config.gameSettingsPreset === 'Custom' && config.gameSettings ? config.gameSettings : {}),
    userGroups: exportGroups
  }
}

// ── Simulate editor.js export logic ────────────────────────────────
function simulateEditorExport (formData) {
  return {
    name: formData.server.serverName,
    saveDirectory: formData.server.saveDirectory,
    logDirectory: formData.server.logDirectory,
    ip: formData.server.ip,
    queryPort: formData.server.queryPort,
    slotCount: formData.server.slotCount,
    voiceChatMode: formData.server.voiceChatMode,
    enableVoiceChat: formData.server.enableVoiceChat,
    enableTextChat: formData.server.enableTextChat,
    gameSettingsPreset: formData.gameSettingsPreset,
    ...(formData.gameSettingsPreset === 'Custom' ? formData.gameSettings : {}),
    userGroups: typeof formData.userGroups === 'string'
      ? JSON.parse(formData.userGroups)
      : formData.userGroups
  }
}

// ── Test 1: browse-detail export with Default preset ───────────────
console.log('Test 1: browse-detail export — Default preset')
{
  const config = {
    name: 'Test Server',
    server: {
      serverName: 'My Test Server',
      saveDirectory: './savegame',
      logDirectory: './logs',
      ip: '0.0.0.0',
      queryPort: 15637,
      slotCount: 16,
      voiceChatMode: 'Proximity',
      enableVoiceChat: true,
      enableTextChat: true
    },
    gameSettingsPreset: 'Default',
    gameSettings: null,
    userGroups: defaultUserGroups
  }
  const result = simulateBrowseDetailExport(config)

  for (const key of REQUIRED_SERVER_KEYS) {
    assert(key in result, `Missing required key: ${key}`)
  }
  for (const key of FORBIDDEN_KEYS) {
    assert(!(key in result), `Forbidden key present: ${key}`)
  }
  assert(Array.isArray(result.userGroups), 'userGroups should be an array')
  assert(result.userGroups.length === 2, 'userGroups should have 2 groups')
  assert(result.userGroups[0].name === 'Admin', 'First group should be Admin')
  assert(typeof result.queryPort === 'number', 'queryPort should be a number')
}

// ── Test 2: browse-detail export with Custom preset ────────────────
console.log('Test 2: browse-detail export — Custom preset')
{
  const config = {
    name: 'Custom Server',
    server: {
      serverName: 'Custom Test',
      saveDirectory: './save',
      logDirectory: './log',
      ip: '192.168.1.1',
      queryPort: 25000,
      slotCount: 8,
      voiceChatMode: 'AlwaysOn',
      enableVoiceChat: false,
      enableTextChat: true
    },
    gameSettingsPreset: 'Custom',
    gameSettings: { ...presets.Relaxed },
    userGroups: defaultUserGroups
  }
  const result = simulateBrowseDetailExport(config)

  // Game settings should be flattened into top level
  for (const key of GAME_SETTINGS_KEYS) {
    assert(key in result, `Missing game setting at top level: ${key}`)
  }
  assert(!('gameSettings' in result), 'gameSettings should not be a nested object')
  assert(result.playerHealthFactor === 2, 'Relaxed preset playerHealthFactor should be 2')

  // Duration values preserved as nanoseconds
  assert(typeof result.dayTimeDuration === 'number', 'dayTimeDuration should be a number')
  assert(result.dayTimeDuration === 1800000000000, 'dayTimeDuration should be 1800000000000 ns')
  assert(result.fromHungerToStarving === 600000000000, 'fromHungerToStarving should be 600000000000 ns')
}

// ── Test 3: userGroups as JSON string (double-encoding bug) ────────
console.log('Test 3: browse-detail export — userGroups as JSON string')
{
  const config = {
    name: 'String Groups',
    server: { serverName: 'Test', queryPort: 15637, slotCount: 16 },
    gameSettingsPreset: 'Default',
    userGroups: JSON.stringify(defaultUserGroups)
  }
  const result = simulateBrowseDetailExport(config)

  assert(Array.isArray(result.userGroups), 'userGroups must be parsed to array, not remain a string')
  assert(typeof result.userGroups !== 'string', 'userGroups must NOT be a string')
  assert(result.userGroups.length === 2, 'Parsed userGroups should have 2 entries')
  assert(result.userGroups[0].canKickBan === true, 'Admin group canKickBan should be true')
}

// ── Test 4: editor.js export with Custom preset ────────────────────
console.log('Test 4: editor export — Custom preset')
{
  const formData = {
    server: {
      serverName: 'Editor Test',
      saveDirectory: './savegame',
      logDirectory: './logs',
      ip: '0.0.0.0',
      queryPort: 15637,
      slotCount: 16,
      voiceChatMode: 'Proximity',
      enableVoiceChat: true,
      enableTextChat: true
    },
    gameSettingsPreset: 'Custom',
    gameSettings: { ...presets.Default },
    userGroups: JSON.stringify(defaultUserGroups)
  }
  const result = simulateEditorExport(formData)

  for (const key of REQUIRED_SERVER_KEYS) {
    assert(key in result, `Missing required key: ${key}`)
  }
  for (const key of FORBIDDEN_KEYS) {
    assert(!(key in result), `Forbidden key present: ${key}`)
  }
  for (const key of GAME_SETTINGS_KEYS) {
    assert(key in result, `Missing game setting at top level: ${key}`)
  }
  assert(Array.isArray(result.userGroups), 'userGroups should be an array')
  assert(typeof result.dayTimeDuration === 'number', 'dayTimeDuration should be a number')
  assert(result.nightTimeDuration === 720000000000, 'nightTimeDuration preserved as ns')
}

// ── Test 5: editor.js export with named preset (not Custom) ────────
console.log('Test 5: editor export — named preset (no gameSettings)')
{
  const formData = {
    server: {
      serverName: 'Relaxed Server',
      saveDirectory: './savegame',
      logDirectory: './logs',
      ip: '0.0.0.0',
      queryPort: 15637,
      slotCount: 16,
      voiceChatMode: 'Proximity',
      enableVoiceChat: true,
      enableTextChat: true
    },
    gameSettingsPreset: 'Relaxed',
    gameSettings: { ...presets.Relaxed },
    userGroups: JSON.stringify(defaultUserGroups)
  }
  const result = simulateEditorExport(formData)

  // Named presets should NOT have gameSettings flattened into the export
  assert(!('playerHealthFactor' in result), 'Named preset should not flatten gameSettings')
  assert(!('gameSettings' in result), 'gameSettings nested object should not appear')
  assert(result.gameSettingsPreset === 'Relaxed', 'Preset name should be preserved')
}

// ── Summary ────────────────────────────────────────────────────────
console.log('')
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
} else {
  console.log('All export validation checks passed.')
}
