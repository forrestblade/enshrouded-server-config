import { defineConfig, collection, field } from '@valencets/valence'

export default defineConfig({
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'enshrouded_config',
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? ''
  },
  server: {
    port: Number(process.env.PORT ?? 3000)
  },
  collections: [
    collection({
      slug: 'server-configs',
      labels: { singular: 'Server Config', plural: 'Server Configs' },
      versions: { drafts: true },
      fields: [
        field.text({ name: 'name', required: true, label: 'Config Name' }),
        field.slug({ name: 'slug', required: true, unique: true, slugFrom: 'name' }),

        // Basic Server Settings
        field.group({
          name: 'server',
          label: 'Basic Server Settings',
          fields: [
            field.text({ name: 'serverName', required: true, defaultValue: 'My Enshrouded Server', label: 'Server Name' }),
            field.text({ name: 'saveDirectory', defaultValue: './savegame', label: 'Save Directory' }),
            field.text({ name: 'logDirectory', defaultValue: './logs', label: 'Log Directory' }),
            field.text({ name: 'ip', defaultValue: '0.0.0.0', label: 'IP Address' }),
            field.number({ name: 'queryPort', defaultValue: 15637, min: 1, max: 65535, label: 'Query Port' }),
            field.number({ name: 'slotCount', defaultValue: 16, min: 1, max: 16, label: 'Slot Count' }),
            field.select({
              name: 'voiceChatMode',
              label: 'Voice Chat Mode',
              defaultValue: 'Proximity',
              options: [
                { label: 'Proximity', value: 'Proximity' },
                { label: 'Always On', value: 'AlwaysOn' },
                { label: 'Disabled', value: 'Disabled' }
              ]
            }),
            field.boolean({ name: 'enableVoiceChat', defaultValue: true, label: 'Enable Voice Chat' }),
            field.boolean({ name: 'enableTextChat', defaultValue: true, label: 'Enable Text Chat' })
          ]
        }),

        // Game Settings Preset
        field.select({
          name: 'gameSettingsPreset',
          label: 'Game Settings Preset',
          defaultValue: 'Default',
          options: [
            { label: 'Default', value: 'Default' },
            { label: 'Relaxed', value: 'Relaxed' },
            { label: 'Hard', value: 'Hard' },
            { label: 'Survival', value: 'Survival' },
            { label: 'Custom', value: 'Custom' }
          ]
        }),

        // Game Settings (shown when preset is Custom)
        field.group({
          name: 'gameSettings',
          label: 'Game Settings',
          fields: [
            // Player stats
            field.number({ name: 'playerHealthFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Player Health Factor' }),
            field.number({ name: 'playerManaFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Player Mana Factor' }),
            field.number({ name: 'playerStaminaFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Player Stamina Factor' }),
            field.number({ name: 'playerBodyHeatFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Player Body Heat Factor' }),
            field.number({ name: 'playerDivingTimeFactor', defaultValue: 1.0, hasDecimals: true, min: 0.5, max: 2.0, label: 'Player Diving Time Factor' }),

            // Survival toggles
            field.select({ name: 'enableDurability', defaultValue: 'true', label: 'Enable Durability', options: [{ label: 'true', value: 'true' }, { label: 'false', value: 'false' }] }),
            field.select({ name: 'enableStarvingDebuff', defaultValue: 'false', label: 'Enable Starving Debuff', options: [{ label: 'true', value: 'true' }, { label: 'false', value: 'false' }] }),
            field.select({ name: 'enableGliderTurbulences', defaultValue: 'true', label: 'Enable Glider Turbulences', options: [{ label: 'true', value: 'true' }, { label: 'false', value: 'false' }] }),
            field.number({ name: 'foodBuffDurationFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Food Buff Duration Factor' }),
            field.number({ name: 'fromHungerToStarving', defaultValue: 600000000000, label: 'Hunger to Starving (ns)' }),
            field.number({ name: 'shroudTimeFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Shroud Time Factor' }),

            // Death & loot
            field.select({ name: 'tombstoneMode', defaultValue: 'AddBackpackMaterials', label: 'Tombstone Mode', options: [{ label: 'Materials Only', value: 'AddBackpackMaterials' }, { label: 'Everything', value: 'Everything' }, { label: 'No Tombstone', value: 'NoTombstone' }] }),

            // Resources & crafting
            field.number({ name: 'miningDamageFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Mining Damage Factor' }),
            field.number({ name: 'plantGrowthSpeedFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Plant Growth Speed Factor' }),
            field.number({ name: 'resourceDropStackAmountFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Resource Drop Stack Amount Factor' }),
            field.number({ name: 'factoryProductionSpeedFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Factory Production Speed Factor' }),

            // Perks
            field.number({ name: 'perkUpgradeRecyclingFactor', defaultValue: 0.5, hasDecimals: true, min: 0.0, max: 1.0, label: 'Perk Upgrade Recycling Factor' }),
            field.number({ name: 'perkCostFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Perk Cost Factor' }),

            // XP
            field.number({ name: 'experienceCombatFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'XP Combat Factor' }),
            field.number({ name: 'experienceMiningFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'XP Mining Factor' }),
            field.number({ name: 'experienceExplorationQuestsFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'XP Exploration/Quests Factor' }),

            // World & weather
            field.select({ name: 'weatherFrequency', defaultValue: 'Normal', label: 'Weather Frequency', options: [{ label: 'Disabled', value: 'Disabled' }, { label: 'Rare', value: 'Rare' }, { label: 'Normal', value: 'Normal' }, { label: 'Often', value: 'Often' }] }),
            field.select({ name: 'fishingDifficulty', defaultValue: 'Normal', label: 'Fishing Difficulty', options: [{ label: 'Very Easy', value: 'VeryEasy' }, { label: 'Easy', value: 'Easy' }, { label: 'Normal', value: 'Normal' }, { label: 'Hard', value: 'Hard' }, { label: 'Very Hard', value: 'VeryHard' }] }),
            field.select({ name: 'curseModifier', defaultValue: 'Normal', label: 'Curse Modifier', options: [{ label: 'Easy (off)', value: 'Easy' }, { label: 'Normal', value: 'Normal' }, { label: 'Hard', value: 'Hard' }] }),

            // Enemies
            field.select({ name: 'randomSpawnerAmount', defaultValue: 'Normal', label: 'Enemy Amount', options: [{ label: 'Few', value: 'Few' }, { label: 'Normal', value: 'Normal' }, { label: 'Many', value: 'Many' }, { label: 'Extreme', value: 'Extreme' }] }),
            field.select({ name: 'aggroPoolAmount', defaultValue: 'Normal', label: 'Aggro Pool Amount', options: [{ label: 'Few', value: 'Few' }, { label: 'Normal', value: 'Normal' }, { label: 'Many', value: 'Many' }, { label: 'Extreme', value: 'Extreme' }] }),
            field.number({ name: 'enemyDamageFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Enemy Damage Factor' }),
            field.number({ name: 'enemyHealthFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Enemy Health Factor' }),
            field.number({ name: 'enemyStaminaFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Enemy Stamina Factor' }),
            field.number({ name: 'enemyPerceptionRangeFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Enemy Perception Range Factor' }),
            field.select({ name: 'pacifyAllEnemies', defaultValue: 'false', label: 'Pacify All Enemies', options: [{ label: 'false', value: 'false' }, { label: 'true', value: 'true' }] }),
            field.select({ name: 'tamingStartleRepercussion', defaultValue: 'LoseSomeProgress', label: 'Taming Startle Repercussion', options: [{ label: 'Keep Progress', value: 'KeepProgress' }, { label: 'Lose Some Progress', value: 'LoseSomeProgress' }, { label: 'Lose All Progress', value: 'LoseAllProgress' }] }),

            // Bosses
            field.number({ name: 'bossDamageFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Boss Damage Factor' }),
            field.number({ name: 'bossHealthFactor', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Boss Health Factor' }),
            field.number({ name: 'threatBonus', defaultValue: 1.0, hasDecimals: true, min: 0.25, max: 4.0, label: 'Threat Bonus' }),

            // Time
            field.number({ name: 'dayTimeDuration', defaultValue: 1800000000000, label: 'Day Time Duration (ns)' }),
            field.number({ name: 'nightTimeDuration', defaultValue: 720000000000, label: 'Night Time Duration (ns)' })
          ]
        }),

        // User Groups stored as JSON
        field.json({
          name: 'userGroups',
          label: 'User Groups',
          defaultValue: [
            {
              name: 'Admin',
              password: '',
              canKickBan: true,
              canAccessInventories: true,
              canEditBase: true,
              canExtendBase: true,
              reservedSlots: 0
            },
            {
              name: 'Default',
              password: '',
              canKickBan: false,
              canAccessInventories: false,
              canEditBase: false,
              canExtendBase: false,
              reservedSlots: 0
            }
          ] as unknown as string
        }),

        // Ownership
        field.relation({ name: 'owner', relationTo: 'users' }),

        // Forking
        field.relation({ name: 'forkedFrom', relationTo: 'server-configs', label: 'Forked From' }),
        field.number({ name: 'forkCount', defaultValue: 0, label: 'Fork Count' }),

        // Tags
        field.json({ name: 'tags', label: 'Tags', defaultValue: [] as unknown as string }),

        // Likes
        field.number({ name: 'likeCount', defaultValue: 0, label: 'Like Count' }),

        // Sharing
        field.boolean({ name: 'shared', defaultValue: false, label: 'Share Publicly' }),
        field.boolean({ name: 'featured', defaultValue: false, label: 'Featured' })
      ],
      search: { fields: ['name'] }
    }),

    collection({
      slug: 'tags',
      labels: { singular: 'Tag', plural: 'Tags' },
      fields: [
        field.text({ name: 'name', required: true, label: 'Tag Name' }),
        field.slug({ name: 'slug', required: true, unique: true, slugFrom: 'name' }),
        field.boolean({ name: 'isCurated', defaultValue: false, label: 'Curated' }),
        field.number({ name: 'usageCount', defaultValue: 0, label: 'Usage Count' })
      ]
    }),

    collection({
      slug: 'users',
      auth: true,
      fields: [
        field.text({ name: 'username', required: true, label: 'Username' }),
        field.text({ name: 'avatarUrl', label: 'Avatar URL' }),
        field.textarea({ name: 'bio', label: 'Bio', maxLength: 500 }),
        field.select({
          name: 'role',
          defaultValue: 'user',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'User', value: 'user' }
          ]
        })
      ]
    })
  ],
  admin: {
    pathPrefix: '/admin',
    requireAuth: true
  },
  telemetry: {
    enabled: true,
    endpoint: '/api/telemetry',
    siteId: 'enshrouded-config'
  }
})
