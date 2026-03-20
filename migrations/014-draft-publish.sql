-- Add draft/publish workflow columns to server-configs
ALTER TABLE "server-configs" ADD COLUMN IF NOT EXISTS "_status" TEXT NOT NULL DEFAULT 'published' CHECK ("_status" IN ('draft', 'published'));
ALTER TABLE "server-configs" ADD COLUMN IF NOT EXISTS "publish_at" TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_server_configs_status ON "server-configs"("_status");
CREATE INDEX IF NOT EXISTS idx_server_configs_publish_at ON "server-configs"("publish_at") WHERE "publish_at" IS NOT NULL;

-- Existing configs are all published
UPDATE "server-configs" SET "_status" = 'published' WHERE "_status" IS NULL;
