/**
 * Enshrouded `enshrouded_server.json` — typed schema (the keystone).
 *
 * Single source of truth for: field validation (Zod), TypeScript types, sane
 * defaults, and the numeric ranges/steps the editor UI renders from. The editor,
 * the validator, and the JSON exporter all read from THIS file so they can never
 * disagree.
 *
 * Product thesis: Enshrouded silently overwrites the whole config with defaults
 * if the JSON is invalid. So every value here is range/enum-locked and objects are
 * `strict` (unknown keys rejected) — making a structurally-invalid export impossible.
 *
 * Spec: docs/reference/enshrouded-schema.md
 */
import { z } from 'zod'

/* ------------------------------------------------------------------ *
 * Enum value sets (exported for the editor's <select> options)
 * ------------------------------------------------------------------ */
export const VOICE_CHAT_MODES = ['Proximity', 'Global'] as const
export const GAME_SETTINGS_PRESETS = ['Default', 'Relaxed', 'Hard', 'Survival', 'Custom'] as const
export const TOMBSTONE_MODES = ['AddBackpackMaterials', 'Everything', 'NoTombstone'] as const
export const WEATHER_FREQUENCIES = ['Disabled', 'Rare', 'Normal', 'Often'] as const
export const SPAWNER_AMOUNTS = ['Few', 'Normal', 'Many', 'Extreme'] as const
export const TAMING_STARTLE_MODES = ['KeepProgress', 'LoseSomeProgress', 'LoseAllProgress'] as const
export const CURSE_MODIFIERS = ['Easy', 'Normal', 'Hard'] as const
export const FISHING_DIFFICULTIES = ['VeryEasy', 'Easy', 'Normal', 'Hard', 'VeryHard'] as const

/* ------------------------------------------------------------------ *
 * Numeric field catalog — the ONE place ranges/steps/defaults live.
 * Zod fields below are built from this map, so validation == UI bounds.
 * ------------------------------------------------------------------ */
export interface NumericFieldSpec {
  /** inclusive minimum */
  min: number
  /** inclusive maximum */
  max: number
  /** default value */
  default: number
  /** UI slider/step increment */
  step: number
  /** integer-valued (nanosecond durations); factors are floats */
  integer?: boolean
  /** nanosecond duration field — UI shows minutes via ns<->min helpers */
  duration?: boolean
}

const NS = 1_000_000_000 // 1 second in nanoseconds
const NS_PER_MIN = 60 * NS // 60_000_000_000

export const GAME_NUMERIC_FIELDS = {
  // Player factors
  playerHealthFactor: { min: 0.25, max: 4, default: 1, step: 0.05 },
  playerManaFactor: { min: 0.25, max: 4, default: 1, step: 0.05 },
  playerStaminaFactor: { min: 0.25, max: 4, default: 1, step: 0.05 },
  playerBodyHeatFactor: { min: 0.5, max: 2, default: 1, step: 0.5 }, // discrete 0.5/1/1.5/2
  playerDivingTimeFactor: { min: 0.5, max: 2, default: 1, step: 0.05 },
  // Survival
  foodBuffDurationFactor: { min: 0.5, max: 2, default: 1, step: 0.05 },
  fromHungerToStarving: { min: 5 * NS_PER_MIN, max: 20 * NS_PER_MIN, default: 10 * NS_PER_MIN, step: NS_PER_MIN, integer: true, duration: true },
  shroudTimeFactor: { min: 0.5, max: 2, default: 1, step: 0.05 },
  // World
  miningDamageFactor: { min: 0.5, max: 2, default: 1, step: 0.05 },
  plantGrowthSpeedFactor: { min: 0.25, max: 2, default: 1, step: 0.05 },
  resourceDropStackAmountFactor: { min: 0.25, max: 2, default: 1, step: 0.05 },
  factoryProductionSpeedFactor: { min: 0.25, max: 2, default: 1, step: 0.05 },
  // Progression
  perkUpgradeRecyclingFactor: { min: 0, max: 1, default: 0.5, step: 0.05 },
  perkCostFactor: { min: 0.25, max: 2, default: 1, step: 0.05 },
  experienceCombatFactor: { min: 0.25, max: 2, default: 1, step: 0.05 },
  experienceMiningFactor: { min: 0, max: 2, default: 1, step: 0.05 },
  experienceExplorationQuestsFactor: { min: 0.25, max: 2, default: 1, step: 0.05 },
  // Enemies
  enemyDamageFactor: { min: 0.25, max: 5, default: 1, step: 0.05 },
  enemyHealthFactor: { min: 0.25, max: 4, default: 1, step: 0.05 },
  enemyStaminaFactor: { min: 0.5, max: 2, default: 1, step: 0.05 },
  enemyPerceptionRangeFactor: { min: 0.5, max: 2, default: 1, step: 0.05 },
  bossDamageFactor: { min: 0.2, max: 5, default: 1, step: 0.05 },
  bossHealthFactor: { min: 0.2, max: 5, default: 1, step: 0.05 },
  threatBonus: { min: 0.25, max: 4, default: 1, step: 0.05 },
  // Day/night cycle (nanoseconds)
  dayTimeDuration: { min: 2 * NS_PER_MIN, max: 60 * NS_PER_MIN, default: 30 * NS_PER_MIN, step: NS_PER_MIN, integer: true, duration: true },
  nightTimeDuration: { min: 2 * NS_PER_MIN, max: 60 * NS_PER_MIN, default: 12 * NS_PER_MIN, step: NS_PER_MIN, integer: true, duration: true },
} satisfies Record<string, NumericFieldSpec>

export type NumericFieldKey = keyof typeof GAME_NUMERIC_FIELDS

/** Build a Zod number field from the catalog so bounds stay in one place. */
function num (key: NumericFieldKey) {
  const f: NumericFieldSpec = GAME_NUMERIC_FIELDS[key]
  const base = f.integer ? z.number().int() : z.number()
  return base.min(f.min).max(f.max).default(f.default)
}

/* ------------------------------------------------------------------ *
 * gameSettings — emitted in full ONLY when gameSettingsPreset = Custom.
 * Field order mirrors docs/reference for a stable JSON export shape.
 * ------------------------------------------------------------------ */
export const gameSettingsSchema = z.strictObject({
  playerHealthFactor: num('playerHealthFactor'),
  playerManaFactor: num('playerManaFactor'),
  playerStaminaFactor: num('playerStaminaFactor'),
  playerBodyHeatFactor: num('playerBodyHeatFactor'),
  playerDivingTimeFactor: num('playerDivingTimeFactor'),
  enableDurability: z.boolean().default(true),
  enableStarvingDebuff: z.boolean().default(false),
  foodBuffDurationFactor: num('foodBuffDurationFactor'),
  fromHungerToStarving: num('fromHungerToStarving'),
  shroudTimeFactor: num('shroudTimeFactor'),
  tombstoneMode: z.enum(TOMBSTONE_MODES).default('AddBackpackMaterials'),
  enableGliderTurbulences: z.boolean().default(true),
  weatherFrequency: z.enum(WEATHER_FREQUENCIES).default('Normal'),
  miningDamageFactor: num('miningDamageFactor'),
  plantGrowthSpeedFactor: num('plantGrowthSpeedFactor'),
  resourceDropStackAmountFactor: num('resourceDropStackAmountFactor'),
  factoryProductionSpeedFactor: num('factoryProductionSpeedFactor'),
  perkUpgradeRecyclingFactor: num('perkUpgradeRecyclingFactor'),
  perkCostFactor: num('perkCostFactor'),
  experienceCombatFactor: num('experienceCombatFactor'),
  experienceMiningFactor: num('experienceMiningFactor'),
  experienceExplorationQuestsFactor: num('experienceExplorationQuestsFactor'),
  randomSpawnerAmount: z.enum(SPAWNER_AMOUNTS).default('Normal'),
  aggroPoolAmount: z.enum(SPAWNER_AMOUNTS).default('Normal'),
  enemyDamageFactor: num('enemyDamageFactor'),
  enemyHealthFactor: num('enemyHealthFactor'),
  enemyStaminaFactor: num('enemyStaminaFactor'),
  enemyPerceptionRangeFactor: num('enemyPerceptionRangeFactor'),
  bossDamageFactor: num('bossDamageFactor'),
  bossHealthFactor: num('bossHealthFactor'),
  threatBonus: num('threatBonus'),
  pacifyAllEnemies: z.boolean().default(false),
  tamingStartleRepercussion: z.enum(TAMING_STARTLE_MODES).default('LoseSomeProgress'),
  dayTimeDuration: num('dayTimeDuration'),
  nightTimeDuration: num('nightTimeDuration'),
  curseModifier: z.enum(CURSE_MODIFIERS).default('Normal'),
  fishingDifficulty: z.enum(FISHING_DIFFICULTIES).default('Normal'),
})

/* ------------------------------------------------------------------ *
 * userGroups[] — access control. Passwords are stripped when publishing.
 * ------------------------------------------------------------------ */
export const userGroupSchema = z.strictObject({
  name: z.string().min(1).max(64),
  password: z.string().max(128).default(''),
  canKickBan: z.boolean().default(false),
  canAccessInventories: z.boolean().default(false),
  canEditBase: z.boolean().default(false),
  canExtendBase: z.boolean().default(false),
  reservedSlots: z.number().int().min(0).max(16).default(0),
})

/* ------------------------------------------------------------------ *
 * Default factories (parse-through so defaults live only in the schema)
 * ------------------------------------------------------------------ */
export function defaultGameSettings (): GameSettings {
  return gameSettingsSchema.parse({})
}

export function defaultUserGroups (): UserGroup[] {
  return [
    { name: 'Admin', password: '', canKickBan: true, canAccessInventories: true, canEditBase: true, canExtendBase: true, reservedSlots: 0 },
    { name: 'Friend', password: '', canKickBan: false, canAccessInventories: true, canEditBase: true, canExtendBase: false, reservedSlots: 0 },
    { name: 'Guest', password: '', canKickBan: false, canAccessInventories: false, canEditBase: false, canExtendBase: false, reservedSlots: 0 },
  ]
}

/* ------------------------------------------------------------------ *
 * Top-level server config — the full editable document.
 * `gameSettings` is always held in full here; the exporter decides whether
 * to emit `{}` (named preset) or the full block (Custom).
 * ------------------------------------------------------------------ */
export const serverConfigSchema = z.strictObject({
  name: z.string().min(1).max(200).default('Enshrouded Server'),
  // Host-injected / advanced — excluded from public shares (see ADVANCED_HOST_FIELDS)
  saveDirectory: z.string().default('./savegame'),
  logDirectory: z.string().default('./logs'),
  ip: z.string().default('0.0.0.0'),
  queryPort: z.number().int().min(1).max(65535).default(15637),
  slotCount: z.number().int().min(1).max(16).default(16),
  voiceChatMode: z.enum(VOICE_CHAT_MODES).default('Proximity'),
  enableVoiceChat: z.boolean().default(true),
  enableTextChat: z.boolean().default(true),
  gameSettingsPreset: z.enum(GAME_SETTINGS_PRESETS).default('Default'),
  gameSettings: gameSettingsSchema.default(() => defaultGameSettings()),
  userGroups: z.array(userGroupSchema).min(1).default(() => defaultUserGroups()),
})

export function defaultServerConfig (): ServerConfig {
  return serverConfigSchema.parse({})
}

/* ------------------------------------------------------------------ *
 * Field metadata for the editor / exporter
 * ------------------------------------------------------------------ */

/** Host-injected + advanced fields — kept for local exports, stripped from public shares. */
export const ADVANCED_HOST_FIELDS = ['saveDirectory', 'logDirectory', 'ip', 'queryPort'] as const
export type AdvancedHostField = (typeof ADVANCED_HOST_FIELDS)[number]

/** gameSettings keys whose values are nanosecond durations (UI edits in minutes). */
export const DURATION_FIELDS = ['fromHungerToStarving', 'dayTimeDuration', 'nightTimeDuration'] as const
export type DurationField = (typeof DURATION_FIELDS)[number]

/* ------------------------------------------------------------------ *
 * ns <-> minutes helpers (durations are numbers, never strings)
 * ------------------------------------------------------------------ */
export const NS_PER_MINUTE = NS_PER_MIN
/** Common day/night cycle presets, in minutes. */
export const DURATION_PRESET_MINUTES = [2, 5, 10, 15, 20, 30, 45, 60] as const

export const nsToMinutes = (ns: number): number => ns / NS_PER_MINUTE
export const minutesToNs = (minutes: number): number => Math.round(minutes * NS_PER_MINUTE)

/* ------------------------------------------------------------------ *
 * Inferred types (output types — all fields present after defaults)
 * ------------------------------------------------------------------ */
export type VoiceChatMode = (typeof VOICE_CHAT_MODES)[number]
export type GameSettingsPreset = (typeof GAME_SETTINGS_PRESETS)[number]
export type TombstoneMode = (typeof TOMBSTONE_MODES)[number]
export type WeatherFrequency = (typeof WEATHER_FREQUENCIES)[number]
export type SpawnerAmount = (typeof SPAWNER_AMOUNTS)[number]
export type TamingStartleMode = (typeof TAMING_STARTLE_MODES)[number]
export type CurseModifier = (typeof CURSE_MODIFIERS)[number]
export type FishingDifficulty = (typeof FISHING_DIFFICULTIES)[number]

export type GameSettings = z.infer<typeof gameSettingsSchema>
export type UserGroup = z.infer<typeof userGroupSchema>
export type ServerConfig = z.infer<typeof serverConfigSchema>

/* ------------------------------------------------------------------ *
 * Validation entry points
 * ------------------------------------------------------------------ */
export const parseServerConfig = (input: unknown): ServerConfig => serverConfigSchema.parse(input)
export const safeParseServerConfig = (input: unknown) => serverConfigSchema.safeParse(input)
