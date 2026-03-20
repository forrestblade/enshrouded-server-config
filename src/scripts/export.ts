import type { ServerConfig, EnshroudedServerJson } from '../entities/server-configs/model/types.js'

export function toEnshroudedJson (config: ServerConfig): EnshroudedServerJson {
  const result: Record<string, unknown> = {
    name: config.server.serverName,
    saveDirectory: config.server.saveDirectory,
    logDirectory: config.server.logDirectory,
    ip: config.server.ip,
    queryPort: config.server.queryPort,
    slotCount: config.server.slotCount,
    voiceChatMode: config.server.voiceChatMode,
    enableVoiceChat: config.server.enableVoiceChat,
    enableTextChat: config.server.enableTextChat,
    gameSettingsPreset: config.gameSettingsPreset
  }

  if (config.gameSettingsPreset === 'Custom' && config.gameSettings) {
    Object.assign(result, config.gameSettings)
  }

  result.userGroups = config.userGroups

  return result as EnshroudedServerJson
}

export function downloadJson (data: EnshroudedServerJson, filename = 'enshrouded_server.json'): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
