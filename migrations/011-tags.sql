CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  "isCurated" BOOLEAN NOT NULL DEFAULT false,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Seed curated tags
INSERT INTO tags (name, slug, "isCurated") VALUES
  ('PvE', 'pve', true),
  ('Hardcore', 'hardcore', true),
  ('Builder', 'builder', true),
  ('Relaxed', 'relaxed', true),
  ('Vanilla+', 'vanilla-plus', true),
  ('Speedrun', 'speedrun', true),
  ('RP', 'rp', true)
ON CONFLICT (name) DO NOTHING;

-- Add tags JSON array column to server-configs
ALTER TABLE "server-configs" ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_server_configs_tags ON "server-configs" USING GIN (tags);
