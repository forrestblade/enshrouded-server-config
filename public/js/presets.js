const base = {
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

export const presets = {
  Default: { ...base },
  Relaxed: {
    ...base,
    playerHealthFactor: 2, playerManaFactor: 2, playerStaminaFactor: 2,
    enableDurability: 'false', enableStarvingDebuff: 'false',
    foodBuffDurationFactor: 2, shroudTimeFactor: 2,
    miningDamageFactor: 2, plantGrowthSpeedFactor: 2,
    resourceDropStackAmountFactor: 2, factoryProductionSpeedFactor: 2,
    experienceCombatFactor: 2, experienceMiningFactor: 2,
    experienceExplorationQuestsFactor: 2,
    enemyDamageFactor: 0.5, enemyHealthFactor: 0.5, enemyStaminaFactor: 0.5,
    bossDamageFactor: 0.5, bossHealthFactor: 0.5
  },
  Hard: {
    ...base,
    playerHealthFactor: 0.5, playerManaFactor: 0.5, playerStaminaFactor: 0.5,
    foodBuffDurationFactor: 0.5, shroudTimeFactor: 0.5,
    miningDamageFactor: 0.5, resourceDropStackAmountFactor: 0.5,
    experienceCombatFactor: 0.5, experienceMiningFactor: 0.5,
    experienceExplorationQuestsFactor: 0.5,
    enemyDamageFactor: 2, enemyHealthFactor: 2, enemyStaminaFactor: 2,
    enemyPerceptionRangeFactor: 2, bossDamageFactor: 2, bossHealthFactor: 2,
    threatBonus: 2, tombstoneMode: 'Everything'
  },
  Survival: {
    ...base,
    playerHealthFactor: 0.25, playerManaFactor: 0.25, playerStaminaFactor: 0.25,
    foodBuffDurationFactor: 0.25, shroudTimeFactor: 0.25,
    fromHungerToStarving: 300000000000,
    miningDamageFactor: 0.5, resourceDropStackAmountFactor: 0.25,
    factoryProductionSpeedFactor: 0.5,
    experienceCombatFactor: 0.25, experienceMiningFactor: 0.25,
    experienceExplorationQuestsFactor: 0.25,
    enemyDamageFactor: 4, enemyHealthFactor: 4, enemyStaminaFactor: 4,
    enemyPerceptionRangeFactor: 4, bossDamageFactor: 4, bossHealthFactor: 4,
    threatBonus: 4, tombstoneMode: 'NoTombstone'
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
  { id: 'playerBodyHeatFactor', label: 'Player Body Heat', tip: 'Multiplier for player body heat retention (25%-400%)', type: 'pct', min: 0.25, max: 4 },
  { id: 'playerDivingTimeFactor', label: 'Player Diving Time', tip: 'Modifies initial oxygen and underwater time (50%-200%)', type: 'pct', min: 0.5, max: 2 },
  // Survival toggles
  { id: 'enableDurability', label: 'Enable Durability', tip: 'Whether items have durability', type: 'select', options: [{ v: 'true', l: 'true' }, { v: 'false', l: 'false' }] },
  { id: 'enableStarvingDebuff', label: 'Enable Starving Debuff', tip: 'Whether the starving debuff is active', type: 'select', options: [{ v: 'true', l: 'true' }, { v: 'false', l: 'false' }] },
  { id: 'enableGliderTurbulences', label: 'Enable Glider Turbulences', tip: 'Whether glider turbulences are active', type: 'select', options: [{ v: 'true', l: 'true' }, { v: 'false', l: 'false' }] },
  { id: 'foodBuffDurationFactor', label: 'Food Buff Duration', tip: 'Multiplier for food buff duration', type: 'pct', min: 0.25, max: 4 },
  // Duration
  { id: 'fromHungerToStarving', label: 'Hunger to Starving', tip: 'Time from hunger to starving state', type: 'duration' },
  { id: 'shroudTimeFactor', label: 'Shroud Time Factor', tip: 'Multiplier for time allowed in the Shroud', type: 'pct', min: 0.25, max: 4 },
  // Death & loot
  { id: 'tombstoneMode', label: 'Tombstone Mode', tip: 'What happens to items on death', type: 'select', options: [{ v: 'AddBackpackMaterials', l: 'Materials Only' }, { v: 'Everything', l: 'Everything' }, { v: 'NoTombstone', l: 'No Tombstone' }] },
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
  // World
  { id: 'weatherFrequency', label: 'Weather Frequency', tip: 'How often weather phenomena appear', type: 'select', options: [{ v: 'Disabled', l: 'Disabled' }, { v: 'Rare', l: 'Rare' }, { v: 'Normal', l: 'Normal' }, { v: 'Often', l: 'Often' }] },
  { id: 'fishingDifficulty', label: 'Fishing Difficulty', tip: 'Difficulty of the fishing minigame', type: 'select', options: [{ v: 'VeryEasy', l: 'Very Easy' }, { v: 'Easy', l: 'Easy' }, { v: 'Normal', l: 'Normal' }, { v: 'Hard', l: 'Hard' }, { v: 'VeryHard', l: 'Very Hard' }] },
  { id: 'curseModifier', label: 'Curse Modifier', tip: 'Curse difficulty modifier', type: 'select', options: [{ v: 'Easy', l: 'Easy (off)' }, { v: 'Normal', l: 'Normal' }, { v: 'Hard', l: 'Hard' }] },
  // Enemies
  { id: 'randomSpawnerAmount', label: 'Enemy Amount', tip: 'Amount of enemies in the world', type: 'select', options: [{ v: 'Few', l: 'Few' }, { v: 'Normal', l: 'Normal' }, { v: 'Many', l: 'Many' }, { v: 'Extreme', l: 'Extreme' }] },
  { id: 'aggroPoolAmount', label: 'Aggro Pool Amount', tip: 'How many enemies can aggro at once', type: 'select', options: [{ v: 'Few', l: 'Few' }, { v: 'Normal', l: 'Normal' }, { v: 'Many', l: 'Many' }, { v: 'Extreme', l: 'Extreme' }] },
  { id: 'enemyDamageFactor', label: 'Enemy Damage', tip: 'Multiplier for enemy damage', type: 'pct', min: 0.25, max: 4 },
  { id: 'enemyHealthFactor', label: 'Enemy Health', tip: 'Multiplier for enemy health', type: 'pct', min: 0.25, max: 4 },
  { id: 'enemyStaminaFactor', label: 'Enemy Stamina', tip: 'Multiplier for enemy stamina', type: 'pct', min: 0.25, max: 4 },
  { id: 'enemyPerceptionRangeFactor', label: 'Enemy Perception Range', tip: 'Multiplier for enemy detection range', type: 'pct', min: 0.25, max: 4 },
  { id: 'pacifyAllEnemies', label: 'Pacify All Enemies', tip: 'Whether all enemies are pacified', type: 'select', options: [{ v: 'false', l: 'false' }, { v: 'true', l: 'true' }] },
  { id: 'tamingStartleRepercussion', label: 'Taming Startle', tip: 'What happens when a tamed creature is startled', type: 'select', options: [{ v: 'KeepProgress', l: 'Keep Progress' }, { v: 'LoseSomeProgress', l: 'Lose Some Progress' }, { v: 'LoseAllProgress', l: 'Lose All Progress' }] },
  // Bosses
  { id: 'bossDamageFactor', label: 'Boss Damage', tip: 'Multiplier for boss damage', type: 'pct', min: 0.25, max: 4 },
  { id: 'bossHealthFactor', label: 'Boss Health', tip: 'Multiplier for boss health', type: 'pct', min: 0.25, max: 4 },
  { id: 'threatBonus', label: 'Threat Bonus', tip: 'Multiplier for threat bonus', type: 'pct', min: 0.25, max: 4 },
  // Time
  { id: 'dayTimeDuration', label: 'Day Time Duration', tip: 'Duration of daytime', type: 'duration' },
  { id: 'nightTimeDuration', label: 'Night Time Duration', tip: 'Duration of nighttime', type: 'duration' }
]

// Human-readable labels for diff summaries
const diffLabels = {
  playerHealthFactor: 'health', playerManaFactor: 'mana', playerStaminaFactor: 'stamina',
  playerBodyHeatFactor: 'body heat', playerDivingTimeFactor: 'diving time',
  enableDurability: 'durability', enableStarvingDebuff: 'starving debuff',
  enableGliderTurbulences: 'glider turbulences',
  foodBuffDurationFactor: 'food buff duration', miningDamageFactor: 'mining speed',
  plantGrowthSpeedFactor: 'plant growth', resourceDropStackAmountFactor: 'resource drops',
  factoryProductionSpeedFactor: 'crafting speed', perkUpgradeRecyclingFactor: 'perk recycling',
  perkCostFactor: 'perk cost', experienceCombatFactor: 'combat XP',
  experienceMiningFactor: 'mining XP', experienceExplorationQuestsFactor: 'quest XP',
  weatherFrequency: 'weather', fishingDifficulty: 'fishing', curseModifier: 'curse',
  tombstoneMode: 'tombstone', randomSpawnerAmount: 'enemy amount',
  aggroPoolAmount: 'aggro pool', pacifyAllEnemies: 'enemies',
  tamingStartleRepercussion: 'taming startle',
  enemyDamageFactor: 'enemy damage', enemyHealthFactor: 'enemy health',
  enemyStaminaFactor: 'enemy stamina', enemyPerceptionRangeFactor: 'enemy perception',
  bossDamageFactor: 'boss damage', bossHealthFactor: 'boss health',
  threatBonus: 'threat bonus', dayTimeDuration: 'day length',
  nightTimeDuration: 'night length', fromHungerToStarving: 'starvation timer',
  shroudTimeFactor: 'shroud time'
}

function formatDiff (key, val, baseVal) {
  // Boolean-string toggles
  if (['enableDurability', 'enableStarvingDebuff', 'enableGliderTurbulences', 'pacifyAllEnemies'].includes(key)) {
    const label = diffLabels[key] || key
    return val === 'true' ? label + ' on' : label + ' off'
  }
  // Select fields
  if (['tombstoneMode', 'weatherFrequency', 'fishingDifficulty', 'curseModifier', 'randomSpawnerAmount', 'aggroPoolAmount', 'tamingStartleRepercussion'].includes(key)) {
    return (diffLabels[key] || key) + ': ' + val
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
