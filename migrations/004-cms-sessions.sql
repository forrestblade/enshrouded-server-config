-- Auth sessions table required by @valencets/cms
CREATE TABLE IF NOT EXISTS "cms_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_sessions_user ON "cms_sessions"("user_id");
CREATE INDEX IF NOT EXISTS idx_cms_sessions_expires ON "cms_sessions"("expires_at");
