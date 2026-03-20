CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "configId" UUID NOT NULL REFERENCES "server-configs"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "configId")
);
CREATE INDEX IF NOT EXISTS idx_likes_config ON likes("configId");
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes("userId");

ALTER TABLE "server-configs" ADD COLUMN IF NOT EXISTS "likeCount" INTEGER NOT NULL DEFAULT 0;
