/**
 * server-config / config / field-catalog — UI grouping + labels for the editor.
 *
 * Maps every gameSettings field into a titled section with a human label and a
 * control kind. Numeric ranges/steps still come from GAME_NUMERIC_FIELDS (the
 * one source of truth); this only adds presentation metadata. Keeps the editor
 * data-driven instead of hand-listing 37 controls.
 */
import {
  TOMBSTONE_MODES,
  WEATHER_FREQUENCIES,
  SPAWNER_AMOUNTS,
  TAMING_STARTLE_MODES,
  CURSE_MODIFIERS,
  FISHING_DIFFICULTIES,
} from '../model/schema'
import type { GameSettings } from '../model/schema'

export type ControlKind = 'number' | 'duration' | 'boolean' | 'enum'

export interface FieldDef {
  key: keyof GameSettings
  label: string
  control: ControlKind
  options?: readonly string[]
  help?: string
}

export interface FieldSection {
  id: string
  title: string
  fields: readonly FieldDef[]
}

export const GAME_SETTINGS_SECTIONS: readonly FieldSection[] = [
  {
    id: 'player',
    title: 'Player',
    fields: [
      { key: 'playerHealthFactor', label: 'Health', control: 'number' },
      { key: 'playerManaFactor', label: 'Mana', control: 'number' },
      { key: 'playerStaminaFactor', label: 'Stamina', control: 'number' },
      { key: 'playerBodyHeatFactor', label: 'Body heat', control: 'number' },
      { key: 'playerDivingTimeFactor', label: 'Diving time', control: 'number' },
    ],
  },
  {
    id: 'survival',
    title: 'Survival',
    fields: [
      { key: 'enableDurability', label: 'Item durability', control: 'boolean' },
      { key: 'enableStarvingDebuff', label: 'Starving debuff', control: 'boolean' },
      { key: 'foodBuffDurationFactor', label: 'Food buff duration', control: 'number' },
      { key: 'fromHungerToStarving', label: 'Hunger → starving', control: 'duration', help: 'Grace period before starving sets in.' },
      { key: 'shroudTimeFactor', label: 'Shroud time', control: 'number' },
      { key: 'tombstoneMode', label: 'Tombstone mode', control: 'enum', options: TOMBSTONE_MODES },
    ],
  },
  {
    id: 'world',
    title: 'World',
    fields: [
      { key: 'enableGliderTurbulences', label: 'Glider turbulence', control: 'boolean' },
      { key: 'weatherFrequency', label: 'Weather frequency', control: 'enum', options: WEATHER_FREQUENCIES },
      { key: 'miningDamageFactor', label: 'Mining speed', control: 'number' },
      { key: 'plantGrowthSpeedFactor', label: 'Plant growth', control: 'number' },
      { key: 'resourceDropStackAmountFactor', label: 'Resource drops', control: 'number' },
      { key: 'factoryProductionSpeedFactor', label: 'Production speed', control: 'number' },
    ],
  },
  {
    id: 'progression',
    title: 'Progression',
    fields: [
      { key: 'perkUpgradeRecyclingFactor', label: 'Perk recycling refund', control: 'number' },
      { key: 'perkCostFactor', label: 'Perk cost', control: 'number' },
      { key: 'experienceCombatFactor', label: 'Combat XP', control: 'number' },
      { key: 'experienceMiningFactor', label: 'Mining XP', control: 'number' },
      { key: 'experienceExplorationQuestsFactor', label: 'Exploration / quest XP', control: 'number' },
    ],
  },
  {
    id: 'enemies',
    title: 'Enemies',
    fields: [
      { key: 'randomSpawnerAmount', label: 'Spawner amount', control: 'enum', options: SPAWNER_AMOUNTS },
      { key: 'aggroPoolAmount', label: 'Aggro pool', control: 'enum', options: SPAWNER_AMOUNTS },
      { key: 'enemyDamageFactor', label: 'Enemy damage', control: 'number' },
      { key: 'enemyHealthFactor', label: 'Enemy health', control: 'number' },
      { key: 'enemyStaminaFactor', label: 'Enemy stamina', control: 'number' },
      { key: 'enemyPerceptionRangeFactor', label: 'Enemy perception', control: 'number' },
      { key: 'bossDamageFactor', label: 'Boss damage', control: 'number' },
      { key: 'bossHealthFactor', label: 'Boss health', control: 'number' },
      { key: 'threatBonus', label: 'Threat bonus', control: 'number' },
      { key: 'pacifyAllEnemies', label: 'Pacify all enemies', control: 'boolean' },
      { key: 'tamingStartleRepercussion', label: 'Taming startle', control: 'enum', options: TAMING_STARTLE_MODES },
    ],
  },
  {
    id: 'cycle',
    title: 'Time & curse',
    fields: [
      { key: 'dayTimeDuration', label: 'Day length', control: 'duration' },
      { key: 'nightTimeDuration', label: 'Night length', control: 'duration' },
      { key: 'curseModifier', label: 'Curse difficulty', control: 'enum', options: CURSE_MODIFIERS },
      { key: 'fishingDifficulty', label: 'Fishing difficulty', control: 'enum', options: FISHING_DIFFICULTIES },
    ],
  },
]
