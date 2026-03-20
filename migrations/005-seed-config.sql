-- Seed a realistic default config: Embervale PvE Server
INSERT INTO "server-configs" (
  "id", "name", "slug",
  "server", "gameSettingsPreset", "gameSettings", "userGroups",
  "created_at", "updated_at"
) VALUES (
  gen_random_uuid(),
  'Embervale PvE Server',
  'embervale-pve-server',
  '{
    "serverName": "Embervale Community",
    "saveDirectory": "./savegame/embervale",
    "logDirectory": "./logs",
    "ip": "0.0.0.0",
    "queryPort": 15637,
    "slotCount": 16,
    "voiceChatMode": "Proximity",
    "enableVoiceChat": true,
    "enableTextChat": true
  }'::jsonb,
  'Custom',
  '{
    "playerHealthFactor": 1.5,
    "playerManaFactor": 1.25,
    "playerStaminaFactor": 1.25,
    "playerBodyHeatFactor": 1.0,
    "enableDurability": 1.0,
    "enableStarvingDebuff": 0.0,
    "foodBuffDurationFactor": 1.5,
    "fromHungerToStarving": 600000000000,
    "shroudTimeFactor": 1.5,
    "tombstoneMode": 0,
    "miningDamageFactor": 1.5,
    "plantGrowthSpeedFactor": 2.0,
    "resourceDropStackAmountFactor": 1.5,
    "factoryProductionSpeedFactor": 1.5,
    "perkUpgradeRecyclingFactor": 0.75,
    "perkCostFactor": 0.75,
    "experienceCombatFactor": 1.5,
    "experienceMiningFactor": 1.5,
    "experienceExplorationQuestsFactor": 1.5,
    "aggroPoolAmount": 1.0,
    "enemyDamageFactor": 0.85,
    "enemyHealthFactor": 0.9,
    "enemyStaminaFactor": 1.0,
    "enemyPerceptionRangeFactor": 1.0,
    "bossDamageFactor": 0.9,
    "bossHealthFactor": 0.9,
    "threatBonusFactor": 1.0,
    "pacifiedEnemies": 0,
    "dayTimeDuration": 1800000000000,
    "nightTimeDuration": 720000000000,
    "waterOfTheWakeMode": 0,
    "waterOfTheWakeDistance": 100
  }'::jsonb,
  '[
    {
      "name": "Admin",
      "password": "",
      "canKickBan": true,
      "canAccessInventories": true,
      "canEditBase": true,
      "canExtendBase": true,
      "reservedSlots": 1
    },
    {
      "name": "Moderator",
      "password": "",
      "canKickBan": true,
      "canAccessInventories": true,
      "canEditBase": false,
      "canExtendBase": false,
      "reservedSlots": 0
    },
    {
      "name": "Player",
      "password": "",
      "canKickBan": false,
      "canAccessInventories": false,
      "canEditBase": true,
      "canExtendBase": true,
      "reservedSlots": 0
    }
  ]'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO NOTHING;
