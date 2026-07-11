-- Scope the FTS mirror trigger to the columns FTS actually indexes.
--
-- The original AFTER UPDATE trigger fired on EVERY server_config update —
-- including view_count/like_count increments — rewriting the FTS row on each
-- page view and like for no reason. `UPDATE OF` limits it to the three
-- mirrored text columns.

DROP TRIGGER IF EXISTS `server_config_fts_au`;
--> statement-breakpoint
CREATE TRIGGER `server_config_fts_au`
AFTER UPDATE OF `title`, `summary`, `server_name` ON `server_config` BEGIN
  UPDATE `server_config_fts`
  SET title = new.title, summary = coalesce(new.summary, ''), server_name = new.server_name
  WHERE config_id = new.id;
END;
