/**
 * shared-config / lib / shareable — strip secrets before a config is published.
 *
 * We persist the FULL ServerConfig (so forking restores the editor exactly) but
 * with anything private removed: userGroup passwords blanked and host fields
 * (save/log dir, ip, queryPort) reset to schema defaults. The result is still a
 * valid ServerConfig. Mirrors the export "public" mode, but keeps editor shape.
 */
import { defaultServerConfig, type ServerConfig } from '@/entities/server-config'

export function toShareableConfig (config: ServerConfig): ServerConfig {
  const defaults = defaultServerConfig()
  return {
    ...config,
    saveDirectory: defaults.saveDirectory,
    logDirectory: defaults.logDirectory,
    ip: defaults.ip,
    queryPort: defaults.queryPort,
    userGroups: config.userGroups.map((group) => ({ ...group, password: '' })),
  }
}
