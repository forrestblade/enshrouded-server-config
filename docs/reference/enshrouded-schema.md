# Enshrouded `enshrouded_server.json` — Authoritative Field Reference

Source of truth: the owner's pre-Valence standalone HTML generator + the WinterNode settings
guide. This is the single reference the typed schema (`src/lib/enshrouded/schema.ts`, Zod) must
encode. The schema drives the editor UI, validation, and JSON export — all from this one spec.

## Product thesis (why validation is the hero feature)
Enshrouded **silently overwrites the whole config with defaults if the JSON is invalid** — no
warning, no log. One missing comma wipes every setting. So the export must be **structurally
impossible to make invalid**: enforce ranges + enums, strict JSON, no trailing commas.

## Gotchas the editor must surface
1. **Custom-preset rule:** if `gameSettingsPreset` ≠ `Custom`, the game **ignores** all
   `gameSettings`. Editor should gray out / warn when a named preset is selected. Export emits
   `gameSettings: {}` for named presets, full block only for `Custom`.
2. **Durations are numbers, not strings.** The legacy HTML emitted `dayTimeDuration` /
   `nightTimeDuration` / `fromHungerToStarving` as strings (`.value`). The game format uses
   **numbers** (see guide preset examples). Emit integers.
3. **Two fields the legacy HTML omitted from export** but are real settings — INCLUDE them:
   `playerDivingTimeFactor` and `fishingDifficulty`.
4. **enableVoiceChat / enableTextChat:** game default is `true`; the legacy HTML defaulted the
   selects to `false`. Use `true` as the sensible default.
5. **No top-level `password`.** Access control is via `userGroups[]` (per-group passwords). The
   WinterNode guide's top-level `password` row is outdated; the HTML (userGroups) is correct.

## Top-level server identity
| key | type | default | notes |
|---|---|---|---|
| `name` | string | "Enshrouded Server" | server browser name |
| `saveDirectory` | string | "./savegame" | host-specific (advanced) |
| `logDirectory` | string | "./logs" | host-specific (advanced) |
| `ip` | string | "0.0.0.0" | host-specific (advanced) |
| `queryPort` | number | 15637 | 1–65535 |
| `slotCount` | number | 16 | 1–16 |
| `voiceChatMode` | enum | "Proximity" | Proximity \| Global |
| `enableVoiceChat` | boolean | true | |
| `enableTextChat` | boolean | true | |
| `gameSettingsPreset` | enum | "Default" | Default \| Relaxed \| Hard \| Survival \| Custom |
| `gameSettings` | object | {} | full block only when preset = Custom |
| `userGroups` | array | see below | ≥1 required |

Note: `ip`/`queryPort`/`saveDirectory`/`logDirectory` are host-injected — **exclude from public
shares**; keep in an "Advanced" section for full local exports.

## `gameSettings` (emitted only when preset = Custom)
All factors are numbers. Ranges are inclusive.

| key | default | range/enum |
|---|---|---|
| playerHealthFactor | 1.0 | 0.25–4 |
| playerManaFactor | 1.0 | 0.25–4 |
| playerStaminaFactor | 1.0 | 0.25–4 |
| playerBodyHeatFactor | 1.0 | 0.5–2 (HTML uses discrete 0.5/1/1.5/2) |
| playerDivingTimeFactor | 1.0 | 0.5–2 |
| enableDurability | true | boolean |
| enableStarvingDebuff | false | boolean |
| foodBuffDurationFactor | 1.0 | 0.5–2 |
| fromHungerToStarving | 600000000000 | 300000000000–1200000000000 (5–20 min, ns) |
| shroudTimeFactor | 1.0 | 0.5–2 |
| tombstoneMode | "AddBackpackMaterials" | AddBackpackMaterials \| Everything \| NoTombstone |
| enableGliderTurbulences | true | boolean |
| weatherFrequency | "Normal" | Disabled \| Rare \| Normal \| Often |
| miningDamageFactor | 1.0 | 0.5–2 |
| plantGrowthSpeedFactor | 1.0 | 0.25–2 |
| resourceDropStackAmountFactor | 1.0 | 0.25–2 |
| factoryProductionSpeedFactor | 1.0 | 0.25–2 |
| perkUpgradeRecyclingFactor | 0.5 | 0–1 |
| perkCostFactor | 1.0 | 0.25–2 |
| experienceCombatFactor | 1.0 | 0.25–2 |
| experienceMiningFactor | 1.0 | 0–2 |
| experienceExplorationQuestsFactor | 1.0 | 0.25–2 |
| randomSpawnerAmount | "Normal" | Few \| Normal \| Many \| Extreme |
| aggroPoolAmount | "Normal" | Few \| Normal \| Many \| Extreme |
| enemyDamageFactor | 1.0 | 0.25–5 |
| enemyHealthFactor | 1.0 | 0.25–4 |
| enemyStaminaFactor | 1.0 | 0.5–2 |
| enemyPerceptionRangeFactor | 1.0 | 0.5–2 |
| bossDamageFactor | 1.0 | 0.2–5 |
| bossHealthFactor | 1.0 | 0.2–5 |
| threatBonus | 1.0 | 0.25–4 |
| pacifyAllEnemies | false | boolean |
| tamingStartleRepercussion | "LoseSomeProgress" | KeepProgress \| LoseSomeProgress \| LoseAllProgress |
| dayTimeDuration | 1800000000000 | 120000000000–3600000000000 (2–60 min, ns) |
| nightTimeDuration | 720000000000 | 120000000000–3600000000000 (2–60 min, ns) |
| curseModifier | "Normal" | Easy \| Normal \| Hard |
| fishingDifficulty | "Normal" | VeryEasy \| Easy \| Normal \| Hard \| VeryHard |

### ns ↔ minutes helper
`minutes = ns / 60000000000`. Common: 2m=120000000000, 5m=300000000000, 10m=600000000000,
15m=900000000000, 20m=1200000000000, 30m=1800000000000, 45m=2700000000000, 60m=3600000000000.
Default cycle = 30 min day / 12 min night.

## `userGroups[]` (≥1 required)
Fields per group: `name` (string), `password` (string), `canKickBan` (bool),
`canAccessInventories` (bool), `canEditBase` (bool), `canExtendBase` (bool),
`reservedSlots` (number ≥0). **Strip passwords when publishing to the community.**

Default set:
- Admin — all perms true
- Friend — canAccessInventories + canEditBase true, rest false
- Guest — all false

## Presets
Named game presets (preset field): Default, Relaxed, Hard, Survival, Custom.

Starter templates (apply as `Custom` values — mine from old `src/scripts/presets.ts`, in git history):
- **Relaxed** — 2× player stats/resources/xp, 0.5× enemies, durability off.
- **Hard** — 0.5× player, 2× enemies/bosses, tombstone Everything.
- **Survival** — 0.25× player, 4× enemies/bosses, starving on, 5-min grace, NoTombstone.
- **Casual/Balanced/Hardcore** — see WinterNode examples in docs/PLAN.md history / guide.

## JSON output shape
```json
{
  "name": "…", "saveDirectory": "./savegame", "logDirectory": "./logs", "ip": "0.0.0.0",
  "queryPort": 15637, "slotCount": 16, "voiceChatMode": "Proximity",
  "enableVoiceChat": true, "enableTextChat": true,
  "gameSettingsPreset": "Custom",
  "gameSettings": { /* full block above, numbers for durations */ },
  "userGroups": [ { "name": "Admin", "password": "", "canKickBan": true, "canAccessInventories": true, "canEditBase": true, "canExtendBase": true, "reservedSlots": 0 } ]
}
```
