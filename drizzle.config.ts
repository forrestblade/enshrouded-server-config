// drizzle-kit config — generates SQL migrations from the Drizzle schema.
//
// `generate` needs only dialect + schema + out (no DB connection). Migrations
// are APPLIED with wrangler (`pnpm db:migrate:local` / `:remote`), so no D1
// http credentials are configured here. `out` matches wrangler's
// `migrations_dir = "migrations"`.
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/shared/db/schema',
  out: './migrations',
})
