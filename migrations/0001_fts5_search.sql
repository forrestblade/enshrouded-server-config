-- FTS5 full-text search over published configs.
--
-- Standalone (own-storage) FTS5 table keyed by the text `config_id` (server_config
-- uses a text PK, so the external-content/rowid pattern doesn't fit cleanly).
-- Triggers mirror server_config.{title,summary,server_name} on every write.
-- All rows are indexed; visibility is enforced at query time by joining back to
-- server_config and filtering `visibility = 'public'`.
--
-- Query shape:
--   SELECT config_id FROM server_config_fts WHERE server_config_fts MATCH ?;
-- then join server_config on id = config_id and filter visibility.

CREATE VIRTUAL TABLE `server_config_fts` USING fts5(
  config_id UNINDEXED,
  title,
  summary,
  server_name,
  tokenize = 'porter unicode61'
);
--> statement-breakpoint
CREATE TRIGGER `server_config_fts_ai` AFTER INSERT ON `server_config` BEGIN
  INSERT INTO `server_config_fts` (config_id, title, summary, server_name)
  VALUES (new.id, new.title, coalesce(new.summary, ''), new.server_name);
END;
--> statement-breakpoint
CREATE TRIGGER `server_config_fts_ad` AFTER DELETE ON `server_config` BEGIN
  DELETE FROM `server_config_fts` WHERE config_id = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER `server_config_fts_au` AFTER UPDATE ON `server_config` BEGIN
  UPDATE `server_config_fts`
  SET title = new.title, summary = coalesce(new.summary, ''), server_name = new.server_name
  WHERE config_id = new.id;
END;
