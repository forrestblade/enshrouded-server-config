-- Add avatar URL to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- Add shared and featured flags to server-configs
ALTER TABLE "server-configs" ADD COLUMN IF NOT EXISTS "shared" BOOLEAN DEFAULT false;
ALTER TABLE "server-configs" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS "idx_server-configs_shared" ON "server-configs"("shared") WHERE "shared" = true;
