-- The CMS auth module hardcodes SELECT ... name FROM users.
-- Since we renamed name -> username, add a generated column alias.
-- Using a view would break writes, so add a generated column instead.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT GENERATED ALWAYS AS ("username") STORED;
