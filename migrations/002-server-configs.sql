-- Drop the sample posts table
DROP TABLE IF EXISTS "posts";

-- Create server-configs table
CREATE TABLE IF NOT EXISTS "server_configs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "server" JSONB NOT NULL DEFAULT '{}',
  "gameSettingsPreset" TEXT NOT NULL DEFAULT 'Default',
  "gameSettings" JSONB NOT NULL DEFAULT '{}',
  "userGroups" JSONB NOT NULL DEFAULT '[]',
  "owner" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_server_configs_slug ON "server_configs"("slug");
CREATE INDEX IF NOT EXISTS idx_server_configs_owner ON "server_configs"("owner");

-- Update users table: change default role from 'editor' to 'user'
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
