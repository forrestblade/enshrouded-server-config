/**
 * server-config / lib / validate — Result-based validation entry points.
 *
 * Wraps the pure Zod `model` in neverthrow so app code (islands, endpoints)
 * handles invalid configs as typed `Result` values instead of exceptions.
 */
import type { Result } from 'neverthrow'
import type { z } from 'zod'
import { parseResult } from '@/shared/lib/result'
import { serverConfigSchema, gameSettingsSchema } from '../model/schema'
import type { ServerConfig, GameSettings } from '../model/schema'

/** Validate an unknown value as a full server config. */
export function validateServerConfig (input: unknown): Result<ServerConfig, z.ZodError> {
  return parseResult(serverConfigSchema, input)
}

/** Validate an unknown value as a gameSettings block. */
export function validateGameSettings (input: unknown): Result<GameSettings, z.ZodError> {
  return parseResult(gameSettingsSchema, input)
}
