export interface UserGroup {
  readonly name: string
  readonly password: string
  readonly canKickBan: boolean
  readonly canAccessInventories: boolean
  readonly canEditBase: boolean
  readonly canExtendBase: boolean
  readonly reservedSlots: number
}

export interface ServerSettings {
  readonly serverName: string
  readonly saveDirectory: string
  readonly logDirectory: string
  readonly ip: string
  readonly queryPort: number
  readonly slotCount: number
  readonly voiceChatMode: 'Proximity' | 'AlwaysOn' | 'Disabled'
  readonly enableVoiceChat: boolean
  readonly enableTextChat: boolean
}

export interface GameSettings {
  readonly playerHealthFactor: number
  readonly playerManaFactor: number
  readonly playerStaminaFactor: number
  readonly playerBodyHeatFactor: number
  readonly playerDivingTimeFactor: number
  readonly enableDurability: string
  readonly enableStarvingDebuff: string
  readonly enableGliderTurbulences: string
  readonly foodBuffDurationFactor: number
  readonly fromHungerToStarving: number
  readonly shroudTimeFactor: number
  readonly tombstoneMode: string
  readonly miningDamageFactor: number
  readonly plantGrowthSpeedFactor: number
  readonly resourceDropStackAmountFactor: number
  readonly factoryProductionSpeedFactor: number
  readonly perkUpgradeRecyclingFactor: number
  readonly perkCostFactor: number
  readonly experienceCombatFactor: number
  readonly experienceMiningFactor: number
  readonly experienceExplorationQuestsFactor: number
  readonly weatherFrequency: string
  readonly fishingDifficulty: string
  readonly curseModifier: string
  readonly randomSpawnerAmount: string
  readonly aggroPoolAmount: string
  readonly enemyDamageFactor: number
  readonly enemyHealthFactor: number
  readonly enemyStaminaFactor: number
  readonly enemyPerceptionRangeFactor: number
  readonly pacifyAllEnemies: string
  readonly tamingStartleRepercussion: string
  readonly bossDamageFactor: number
  readonly bossHealthFactor: number
  readonly threatBonus: number
  readonly dayTimeDuration: number
  readonly nightTimeDuration: number
}

export type GameSettingsPreset = 'Default' | 'Relaxed' | 'Hard' | 'Survival' | 'Custom'

export interface ServerConfig {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly server: ServerSettings
  readonly gameSettingsPreset: GameSettingsPreset
  readonly gameSettings: GameSettings
  readonly userGroups: UserGroup[]
  readonly owner?: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface EnshroudedServerJson {
  readonly name: string
  readonly saveDirectory: string
  readonly logDirectory: string
  readonly ip: string
  readonly queryPort: number
  readonly slotCount: number
  readonly voiceChatMode: string
  readonly enableVoiceChat: boolean
  readonly enableTextChat: boolean
  readonly gameSettingsPreset: string
  readonly [key: string]: unknown
  readonly userGroups: UserGroup[]
}
