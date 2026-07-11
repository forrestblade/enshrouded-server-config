/**
 * shared-config / model / types — the published/shared config domain.
 *
 * A "shared config" is a `ServerConfig` a user published to the browse gallery.
 * This module is CLIENT-SAFE (only zod + the server-config entity); the D1
 * repository lives in `../api/repo` (server-only) and is imported directly.
 */
import { z } from 'zod'
import { serverConfigSchema, type ServerConfig } from '@/entities/server-config'

export const CONFIG_VISIBILITIES = ['private', 'unlisted', 'public'] as const
export type ConfigVisibility = (typeof CONFIG_VISIBILITIES)[number]

export const CONFIG_MAX_TAGS = 8
export const CONFIG_SORTS = ['recent', 'popular'] as const
export type ConfigSort = (typeof CONFIG_SORTS)[number]

/** Validated body of a publish request (POST /api/configs). */
export const publishInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().max(300).optional().default(''),
  visibility: z.enum(CONFIG_VISIBILITIES).default('public'),
  tags: z.array(z.string().trim().min(1).max(30)).max(CONFIG_MAX_TAGS).default([]),
  config: serverConfigSchema,
  forkedFromSlug: z.string().trim().max(80).optional(),
})
export type PublishInput = z.infer<typeof publishInputSchema>

export interface ConfigAuthor {
  username: string | null
  displayUsername: string | null
  image: string | null
}

export interface ConfigListItem {
  slug: string
  title: string
  summary: string | null
  serverName: string
  gameSettingsPreset: string
  likeCount: number
  viewCount: number
  createdAt: Date
  author: ConfigAuthor
  tags: string[]
}

export interface ConfigDetail extends ConfigListItem {
  id: string
  visibility: ConfigVisibility
  config: ServerConfig
  forkedFrom: { slug: string, title: string } | null
  likedByViewer: boolean
  isOwner: boolean
}

export interface TagFacet {
  slug: string
  name: string
  count: number
}
