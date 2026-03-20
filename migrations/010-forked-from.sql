ALTER TABLE "server-configs" ADD COLUMN IF NOT EXISTS "forkedFrom" UUID REFERENCES "server-configs"(id) ON DELETE SET NULL;
ALTER TABLE "server-configs" ADD COLUMN IF NOT EXISTS "forkCount" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_server_configs_forked_from ON "server-configs"("forkedFrom");
