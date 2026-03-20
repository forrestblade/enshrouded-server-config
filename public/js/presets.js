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

export const presets = {
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
  },
  Hard: {
    ...base,
    playerHealthFactor: 0.5, playerManaFactor: 0.5, playerStaminaFactor: 0.5,
    foodBuffDurationFactor: 0.5, shroudTimeFactor: 0.5, miningDamageFactor: 0.5,
    resourceDropStackAmountFactor: 0.5, experienceCombatFactor: 0.5,
    experienceMiningFactor: 0.5, experienceExplorationQuestsFactor: 0.5,
    enemyDamageFactor: 2, enemyHealthFactor: 2, enemyStaminaFactor: 2,
    enemyPerceptionRangeFactor: 2, bossDamageFactor: 2, bossHealthFactor: 2,
    threatBonusFactor: 2, tombstoneMode: 1
  },
  Survival: {
    ...base,
    playerHealthFactor: 0.25, playerManaFactor: 0.25, playerStaminaFactor: 0.25,
    foodBuffDurationFactor: 0.25, shroudTimeFactor: 0.25,
    fromHungerToStarving: 300000000000, miningDamageFactor: 0.5,
    resourceDropStackAmountFactor: 0.25, factoryProductionSpeedFactor: 0.5,
    experienceCombatFactor: 0.25, experienceMiningFactor: 0.25,
    experienceExplorationQuestsFactor: 0.25, enemyDamageFactor: 4,
    enemyHealthFactor: 4, enemyStaminaFactor: 4, enemyPerceptionRangeFactor: 4,
    bossDamageFactor: 4, bossHealthFactor: 4, threatBonusFactor: 4, tombstoneMode: 2
  }
}

export const defaultUserGroups = [
  { name: 'Admin', password: '', canKickBan: true, canAccessInventories: true, canEditBase: true, canExtendBase: true, reservedSlots: 0 },
  { name: 'Default', password: '', canKickBan: false, canAccessInventories: false, canEditBase: false, canExtendBase: false, reservedSlots: 0 }
]

/** Field definitions for dynamically building the game settings grid */
export const gameSettingsFields = [
  // Player
  { id: 'playerHealthFactor', label: 'Player Health Factor', tip: 'Multiplier for player maximum health (25%-400%)', type: 'pct', min: 0.25, max: 4 },
  { id: 'playerManaFactor', label: 'Player Mana Factor', tip: 'Multiplier for player maximum mana (25%-400%)', type: 'pct', min: 0.25, max: 4 },
  { id: 'playerStaminaFactor', label: 'Player Stamina Factor', tip: 'Multiplier for player maximum stamina (25%-400%)', type: 'pct', min: 0.25, max: 4 },
  { id: 'playerBodyHeatFactor', label: 'Player Body Heat', tip: 'Multiplier for player body heat retention', type: 'pct', min: 0.25, max: 4 },
  // Toggles
  { id: 'enableDurability', label: 'Enable Durability', tip: '0 = disabled, 1 = enabled', type: 'pct', min: 0, max: 1, step: 1 },
  { id: 'enableStarvingDebuff', label: 'Enable Starving Debuff', tip: '0 = disabled, 1 = enabled', type: 'pct', min: 0, max: 1, step: 1 },
  { id: 'foodBuffDurationFactor', label: 'Food Buff Duration', tip: 'Multiplier for food buff duration', type: 'pct', min: 0.25, max: 4 },
  // Duration
  { id: 'fromHungerToStarving', label: 'Hunger to Starving', tip: 'Time from hunger state to starving state', type: 'duration' },
  { id: 'shroudTimeFactor', label: 'Shroud Time Factor', tip: 'Multiplier for time allowed in the Shroud', type: 'pct', min: 0.25, max: 4 },
  // Tombstone
  { id: 'tombstoneMode', label: 'Tombstone Mode', tip: '0 = keep all items, 1 = drop bag, 2 = drop all', type: 'select', options: [{ v: 0, l: 'Keep All Items' }, { v: 1, l: 'Drop Bag on Death' }, { v: 2, l: 'Drop All on Death' }] },
  // Resources
  { id: 'miningDamageFactor', label: 'Mining Damage Factor', tip: 'Multiplier for mining damage', type: 'pct', min: 0.25, max: 4 },
  { id: 'plantGrowthSpeedFactor', label: 'Plant Growth Speed', tip: 'Multiplier for plant growth speed', type: 'pct', min: 0.25, max: 4 },
  { id: 'resourceDropStackAmountFactor', label: 'Resource Drop Amount', tip: 'Multiplier for resource drops', type: 'pct', min: 0.25, max: 4 },
  { id: 'factoryProductionSpeedFactor', label: 'Factory Production Speed', tip: 'Multiplier for crafting speed', type: 'pct', min: 0.25, max: 4 },
  // Perks
  { id: 'perkUpgradeRecyclingFactor', label: 'Perk Recycling', tip: 'Resources returned when recycling perks', type: 'pct', min: 0, max: 1 },
  { id: 'perkCostFactor', label: 'Perk Cost Factor', tip: 'Multiplier for perk costs', type: 'pct', min: 0.25, max: 4 },
  // XP
  { id: 'experienceCombatFactor', label: 'XP Combat', tip: 'Multiplier for combat XP', type: 'pct', min: 0.25, max: 4 },
  { id: 'experienceMiningFactor', label: 'XP Mining', tip: 'Multiplier for mining XP', type: 'pct', min: 0.25, max: 4 },
  { id: 'experienceExplorationQuestsFactor', label: 'XP Exploration/Quests', tip: 'Multiplier for exploration/quest XP', type: 'pct', min: 0.25, max: 4 },
  // Enemies
  { id: 'aggroPoolAmount', label: 'Aggro Pool Amount', tip: 'Multiplier for aggro pool', type: 'pct', min: 0.25, max: 4 },
  { id: 'enemyDamageFactor', label: 'Enemy Damage', tip: 'Multiplier for enemy damage', type: 'pct', min: 0.25, max: 4 },
  { id: 'enemyHealthFactor', label: 'Enemy Health', tip: 'Multiplier for enemy health', type: 'pct', min: 0.25, max: 4 },
  { id: 'enemyStaminaFactor', label: 'Enemy Stamina', tip: 'Multiplier for enemy stamina', type: 'pct', min: 0.25, max: 4 },
  { id: 'enemyPerceptionRangeFactor', label: 'Enemy Perception Range', tip: 'Multiplier for enemy detection range', type: 'pct', min: 0.25, max: 4 },
  // Bosses
  { id: 'bossDamageFactor', label: 'Boss Damage', tip: 'Multiplier for boss damage', type: 'pct', min: 0.25, max: 4 },
  { id: 'bossHealthFactor', label: 'Boss Health', tip: 'Multiplier for boss health', type: 'pct', min: 0.25, max: 4 },
  { id: 'threatBonusFactor', label: 'Threat Bonus', tip: 'Multiplier for threat bonus', type: 'pct', min: 0.25, max: 4 },
  // Misc
  { id: 'pacifiedEnemies', label: 'Pacified Enemies', tip: '0 = normal, 1 = pacified', type: 'select', options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Pacified' }] },
  // Time
  { id: 'dayTimeDuration', label: 'Day Time Duration', tip: 'Duration of daytime', type: 'duration' },
  { id: 'nightTimeDuration', label: 'Night Time Duration', tip: 'Duration of nighttime', type: 'duration' },
  // Water of the Wake
  { id: 'waterOfTheWakeMode', label: 'Water of the Wake Mode', tip: '0 = disabled, 1 = enabled, 2 = distance-based', type: 'select', options: [{ v: 0, l: 'Disabled' }, { v: 1, l: 'Enabled' }, { v: 2, l: 'Distance-Based' }] },
  { id: 'waterOfTheWakeDistance', label: 'Water of the Wake Distance', tip: 'Distance for distance-based mode', type: 'number', min: 0 }
]

// Human-readable labels for diff summaries
const diffLabels = {
  playerHealthFactor: 'health',
  playerManaFactor: 'mana',
  playerStaminaFactor: 'stamina',
  playerBodyHeatFactor: 'body heat',
  enableDurability: 'durability',
  enableStarvingDebuff: 'starving debuff',
  foodBuffDurationFactor: 'food buff duration',
  miningDamageFactor: 'mining speed',
  plantGrowthSpeedFactor: 'plant growth',
  resourceDropStackAmountFactor: 'resource drops',
  factoryProductionSpeedFactor: 'crafting speed',
  perkUpgradeRecyclingFactor: 'perk recycling',
  perkCostFactor: 'perk cost',
  experienceCombatFactor: 'combat XP',
  experienceMiningFactor: 'mining XP',
  experienceExplorationQuestsFactor: 'quest XP',
  skillDamageFactor: 'skill damage',
  tombstoneMode: 'tombstone',
  pacifiedEnemies: 'enemies',
  enemyDamageFactor: 'enemy damage',
  enemyHealthFactor: 'enemy health',
  enemyStaminaFactor: 'enemy stamina',
  enemyPerceptionRangeFactor: 'enemy perception',
  bossDamageFactor: 'boss damage',
  bossHealthFactor: 'boss health',
  threatBonusFactor: 'threat bonus',
  dayTimeDuration: 'day length',
  nightTimeDuration: 'night length',
  fromHungerToStarving: 'starvation timer',
  shroudTimeFactor: 'shroud time',
  aggroPoolAmount: 'aggro pool',
  waterOfTheWakeMode: 'wake mode',
  waterOfTheWakeDistance: 'wake distance'
}

function formatDiff (key, val, baseVal) {
  // Special cases
  if (key === 'pacifiedEnemies') {
    return val === 1 ? 'enemies disabled' : 'enemies enabled'
  }
  if (key === 'enableDurability') {
    return val === 0 ? 'no durability' : 'durability on'
  }
  if (key === 'enableStarvingDebuff') {
    return val === 0 ? 'no starving debuff' : 'starving debuff on'
  }
  if (key === 'tombstoneMode') {
    const modes = ['keep items', 'drop bag', 'drop all']
    return 'tombstone: ' + (modes[val] || val)
  }
  if (key === 'waterOfTheWakeMode') {
    const modes = ['wake disabled', 'wake enabled', 'wake distance-based']
    return modes[val] || 'wake mode: ' + val
  }
  // Duration fields (nanoseconds)
  if (['dayTimeDuration', 'nightTimeDuration', 'fromHungerToStarving'].includes(key)) {
    const mins = Math.round(val / 60000000000)
    const baseMins = Math.round(baseVal / 60000000000)
    if (mins !== baseMins) {
      return mins + 'min ' + (diffLabels[key] || key)
    }
    return null
  }
  // Factor fields - show as multiplier
  const label = diffLabels[key] || key
  if (typeof val === 'number' && typeof baseVal === 'number') {
    return val + 'x ' + label
  }
  return label + ': ' + val
}

export function diffFromDefault (gameSettings, presetName) {
  if (!gameSettings || presetName === 'Default') return null
  const defaultBase = presets.Default
  const diffs = []
  for (const [key, val] of Object.entries(gameSettings)) {
    if (val !== defaultBase[key]) {
      const formatted = formatDiff(key, val, defaultBase[key])
      if (formatted) diffs.push(formatted)
    }
  }
  return diffs.length ? diffs.join(', ') : null
}
