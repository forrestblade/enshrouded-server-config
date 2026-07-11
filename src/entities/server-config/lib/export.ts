/**
 * server-config / lib / export — turn a config into `enshrouded_server.json`.
 *
 * Rules (see docs/reference/enshrouded-schema.md):
 *  - Named preset (≠ Custom) → emit `gameSettings: {}` (the game ignores it).
 *  - Custom → emit the full gameSettings block; factors rounded to kill float drift.
 *  - Public share → strip host fields (save/log dir, ip, queryPort) + blank passwords.
 *  - Output is strict JSON (no trailing commas) so it can never be silently rejected.
 */
import type { Result } from 'neverthrow'
import type { z } from 'zod'
import { parseResult } from '@/shared/lib/result'
import { serverConfigSchema, GAME_NUMERIC_FIELDS } from '../model/schema'
import type {
  ServerConfig,
  GameSettings,
  UserGroup,
  VoiceChatMode,
  GameSettingsPreset,
  NumericFieldSpec,
} from '../model/schema'

export interface EnshroudedServerJson {
  name: string
  saveDirectory?: string
  logDirectory?: string
  ip?: string
  queryPort?: number
  slotCount: number
  voiceChatMode: VoiceChatMode
  enableVoiceChat: boolean
  enableTextChat: boolean
  gameSettingsPreset: GameSettingsPreset
  gameSettings: GameSettings | Record<string, never>
  userGroups: UserGroup[]
}

export interface ExportOptions {
  /** Public share: strip host fields + blank userGroup passwords. */
  public?: boolean
}

/** Round non-duration factors to 2 decimals (durations stay integer ns). */
function roundFactors (gs: GameSettings): GameSettings {
  const out: Record<string, unknown> = { ...gs }
  for (const [key, spec] of Object.entries(GAME_NUMERIC_FIELDS) as Array<[string, NumericFieldSpec]>) {
    if (!spec.duration && typeof out[key] === 'number') {
      out[key] = Math.round((out[key] as number) * 100) / 100
    }
  }
  return out as GameSettings
}

/**
 * Shape a VALID config into the game's JSON structure. Pure — assumes the input
 * already satisfies `ServerConfig` (the type guarantees it). Use
 * {@link toEnshroudedJsonResult} when the input is untrusted.
 */
export function toEnshroudedJson (config: ServerConfig, opts: ExportOptions = {}): EnshroudedServerJson {
  const isCustom = config.gameSettingsPreset === 'Custom'
  const json: EnshroudedServerJson = {
    name: config.name,
    saveDirectory: config.saveDirectory,
    logDirectory: config.logDirectory,
    ip: config.ip,
    queryPort: config.queryPort,
    slotCount: config.slotCount,
    voiceChatMode: config.voiceChatMode,
    enableVoiceChat: config.enableVoiceChat,
    enableTextChat: config.enableTextChat,
    gameSettingsPreset: config.gameSettingsPreset,
    gameSettings: isCustom ? roundFactors(config.gameSettings) : {},
    userGroups: config.userGroups.map((g) => (opts.public ? { ...g, password: '' } : g)),
  }
  if (opts.public) {
    delete json.saveDirectory
    delete json.logDirectory
    delete json.ip
    delete json.queryPort
  }
  return json
}

/** Validate an untrusted config, then shape it. Returns a Result (never throws). */
export function toEnshroudedJsonResult (
  input: unknown,
  opts: ExportOptions = {}
): Result<EnshroudedServerJson, z.ZodError> {
  return parseResult(serverConfigSchema, input).map((config) => toEnshroudedJson(config, opts))
}

/** Pretty, strict JSON string (2-space, trailing newline). */
export function stringifyEnshroudedJson (config: ServerConfig, opts: ExportOptions = {}): string {
  return JSON.stringify(toEnshroudedJson(config, opts), null, 2) + '\n'
}

/** Browser download of the config as a .json file. No-op outside the browser. */
export function downloadEnshroudedJson (
  config: ServerConfig,
  opts: ExportOptions & { filename?: string } = {}
): void {
  if (typeof document === 'undefined') return
  const { filename = 'enshrouded_server.json', ...exportOpts } = opts
  const blob = new Blob([stringifyEnshroudedJson(config, exportOpts)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
