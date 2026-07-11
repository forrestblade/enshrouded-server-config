/**
 * fork-config / lib / fork — load a shared config into the editor as a new draft.
 *
 * Writes the config into the editor's draft slot and records the source slug so
 * the next publish links lineage (forkedFromId). Then navigates to /editor.
 */
import type { ServerConfig } from '@/entities/server-config'
import { DRAFT_KEY, FORKED_FROM_KEY } from '@/shared/config/keys'

export function forkIntoEditor (config: ServerConfig, sourceSlug: string): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(config))
    localStorage.setItem(FORKED_FROM_KEY, sourceSlug)
  } catch { /* storage unavailable — still navigate */ }
  window.location.href = '/editor'
}
