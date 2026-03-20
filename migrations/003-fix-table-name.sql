-- Valence CMS uses the collection slug as the table name.
-- Rename to match the slug 'server-configs'.
ALTER TABLE "server_configs" RENAME TO "server-configs";

-- Recreate indexes with correct table reference
DROP INDEX IF EXISTS idx_server_configs_slug;
DROP INDEX IF EXISTS idx_server_configs_owner;
CREATE INDEX IF NOT EXISTS "idx_server-configs_slug" ON "server-configs"("slug");
CREATE INDEX IF NOT EXISTS "idx_server-configs_owner" ON "server-configs"("owner");
