# Enshrouded Server Config

Configure and manage Enshrouded dedicated server settings. Built with [Valence](https://github.com/valencets/valence).

## Features

- Create and manage multiple server configurations
- Collapsible sections for server settings, game settings, and user groups
- Percentage sliders for game balance factors
- Game settings presets (Default, Relaxed, Hard, Survival, Custom)
- Dynamic user group management (add, edit, delete)
- Export configs as JSON for the Enshrouded dedicated server
- Session auth with Argon2id
- First-party analytics via Valence telemetry
- PostgreSQL persistence

## Development

```bash
pnpm install
pnpm migrate
pnpm dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin

## Environment

Copy `.env.example` to `.env` and configure:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=enshrouded_config
DB_USER=postgres
DB_PASSWORD=
PORT=3000
CMS_SECRET=change-me
```
