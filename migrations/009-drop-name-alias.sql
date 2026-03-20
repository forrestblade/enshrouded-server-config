-- Migration 008 added a GENERATED ALWAYS column "name" as an alias for "username".
-- This is no longer needed since Valence CMS 0.4.0 resolves the display field
-- dynamically from the collection config.
ALTER TABLE "users" DROP COLUMN IF EXISTS "name";
