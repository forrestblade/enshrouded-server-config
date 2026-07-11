/**
 * Application content tables — Drizzle (SQLite / D1).
 *
 * The social layer: published configs, tags, the config<->tag join, and likes.
 * FTS5 search over server_config lives in a hand-written migration (drizzle-kit
 * cannot express virtual tables); see migrations/*_fts5_search.sql. Its triggers
 * mirror server_config.{title,summary,server_name}, so keep those column names
 * in sync with that SQL if they ever change.
 */
import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { user } from './auth'

/** Visibility of a published config. Only `public` appears in browse/search. */
export const CONFIG_VISIBILITIES = ['private', 'unlisted', 'public'] as const
export type ConfigVisibility = (typeof CONFIG_VISIBILITIES)[number]

/**
 * A saved / shared Enshrouded config. `config` holds the JSON-serialized,
 * secret-stripped ServerConfig (passwords + host fields removed on publish).
 * `serverName` / `gameSettingsPreset` are denormalized off that JSON for cheap
 * browse listing + FTS indexing without parsing every row.
 */
export const serverConfig = sqliteTable('server_config', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  serverName: text('server_name').notNull(),
  gameSettingsPreset: text('game_settings_preset').notNull(),
  config: text('config').notNull(),
  visibility: text('visibility', { enum: CONFIG_VISIBILITIES }).notNull().default('private'),
  forkedFromId: text('forked_from_id').references((): AnySQLiteColumn => serverConfig.id, { onDelete: 'set null' }),
  likeCount: integer('like_count').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
}, (t) => [
  index('idx_server_config_user').on(t.userId),
  index('idx_server_config_visibility').on(t.visibility),
  index('idx_server_config_created').on(t.createdAt),
  index('idx_server_config_likes').on(t.likeCount),
  index('idx_server_config_forked_from').on(t.forkedFromId),
])

/** A browse/search facet. `slug` is the URL-safe key; `name` is the display label. */
export const tag = sqliteTable('tag', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
})

/** config <-> tag join (many-to-many). */
export const configTag = sqliteTable('config_tag', {
  configId: text('config_id').notNull().references(() => serverConfig.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tag.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.configId, t.tagId] }),
  index('idx_config_tag_tag').on(t.tagId),
])

/** A user's like on a config. One per (user, config); likeCount is the cached rollup. */
export const like = sqliteTable('like', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  configId: text('config_id').notNull().references(() => serverConfig.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.configId] }),
  index('idx_like_config').on(t.configId),
])
