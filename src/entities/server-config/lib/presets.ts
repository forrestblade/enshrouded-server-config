/**
 * server-config / lib / presets — editor starter templates.
 *
 * These are OUR editor templates: each fills in `Custom` gameSettings values so
 * players can start from a vibe and tweak. (Distinct from the game's built-in
 * named presets in `gameSettingsPreset` — when a named preset is selected the
 * game ignores gameSettings entirely.) Applying a template always implies
 * `gameSettingsPreset = 'Custom'`.
 *
 * Every template's values are validated against the schema ranges in tests, so a
 * template can never produce an out-of-range (invalid) export.
 */
import { defaultGameSettings, gameSettingsSchema } from '../model/schema'
import type { GameSettings } from '../model/schema'

export interface PresetTemplate {
  id: string
  label: string
  description: string
  /** Overrides applied on top of default gameSettings. */
  settings: Partial<GameSettings>
}

export const PRESET_TEMPLATES: readonly PresetTemplate[] = [
  {
    id: 'relaxed',
    label: 'Relaxed',
    description: 'Double player stats, weaker enemies, durability off.',
    settings: {
      playerHealthFactor: 2,
      playerManaFactor: 2,
      playerStaminaFactor: 2,
      resourceDropStackAmountFactor: 2,
      plantGrowthSpeedFactor: 2,
      factoryProductionSpeedFactor: 2,
      experienceCombatFactor: 2,
      experienceMiningFactor: 2,
      experienceExplorationQuestsFactor: 2,
      enemyDamageFactor: 0.5,
      enemyHealthFactor: 0.5,
      bossDamageFactor: 0.5,
      bossHealthFactor: 0.5,
      threatBonus: 0.5,
      enableDurability: false,
      perkCostFactor: 0.5,
      perkUpgradeRecyclingFactor: 1,
    },
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Small player buffs and slightly easier enemies.',
    settings: {
      playerHealthFactor: 1.5,
      playerStaminaFactor: 1.5,
      enemyDamageFactor: 0.75,
      enemyHealthFactor: 0.75,
      experienceCombatFactor: 1.5,
      experienceExplorationQuestsFactor: 1.5,
      resourceDropStackAmountFactor: 1.5,
      enableDurability: false,
    },
  },
  {
    id: 'balanced',
    label: 'Balanced (vanilla)',
    description: 'Default game values as a Custom starting point.',
    settings: {},
  },
  {
    id: 'hard',
    label: 'Hard',
    description: 'Halved player stats, double enemy strength, tombstone drops everything.',
    settings: {
      playerHealthFactor: 0.5,
      playerManaFactor: 0.5,
      playerStaminaFactor: 0.5,
      enemyDamageFactor: 2,
      enemyHealthFactor: 2,
      bossDamageFactor: 2,
      bossHealthFactor: 2,
      threatBonus: 2,
      tombstoneMode: 'Everything',
      enableStarvingDebuff: true,
      shroudTimeFactor: 0.75,
      perkCostFactor: 1.5,
    },
  },
  {
    id: 'survival',
    label: 'Survival',
    description: 'Quarter player stats, four times enemy strength, starving on, no tombstone.',
    settings: {
      playerHealthFactor: 0.25,
      playerManaFactor: 0.25,
      playerStaminaFactor: 0.25,
      enemyDamageFactor: 4,
      enemyHealthFactor: 4,
      bossDamageFactor: 4,
      bossHealthFactor: 4,
      threatBonus: 4,
      enableStarvingDebuff: true,
      fromHungerToStarving: 300000000000,
      tombstoneMode: 'NoTombstone',
      enableDurability: true,
      foodBuffDurationFactor: 0.5,
    },
  },
  {
    id: 'hardcore',
    label: 'Hardcore',
    description: 'Very strong enemies, harsh survival, minimal safety nets.',
    settings: {
      playerHealthFactor: 0.5,
      playerStaminaFactor: 0.75,
      enemyDamageFactor: 3,
      enemyHealthFactor: 3,
      bossDamageFactor: 3,
      bossHealthFactor: 3,
      threatBonus: 3,
      enableStarvingDebuff: true,
      fromHungerToStarving: 300000000000,
      tombstoneMode: 'NoTombstone',
      enableDurability: true,
      shroudTimeFactor: 0.5,
      foodBuffDurationFactor: 0.5,
    },
  },
]

/** Full, validated gameSettings for a template (defaults + overrides). */
export function buildTemplateSettings (template: PresetTemplate): GameSettings {
  return gameSettingsSchema.parse({ ...defaultGameSettings(), ...template.settings })
}

export function getPresetTemplate (id: string): PresetTemplate | undefined {
  return PRESET_TEMPLATES.find((t) => t.id === id)
}
