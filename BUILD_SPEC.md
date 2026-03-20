# Enshrouded Server Config — Build Spec & Feature Document

## Overview

A full-stack web application for creating, managing, and sharing Enshrouded dedicated server configurations. Built with [Valence CMS](https://github.com/valencets/valence).

**Stack:** Node.js + TypeScript, PostgreSQL, Valence CMS v0.9.0, vanilla HTML/CSS/JS (no bundler)

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — hero + "My Configurations" list |
| `/login` | Email/password login |
| `/signup` | User registration |
| `/browse` | Browse shared configs with search + preset filter |
| `/browse/:id` | Config detail — read-only view, export JSON, clone |
| `/config/new` | Create config (name + preset) |
| `/config/:id` | Full config editor (server, game, user groups) |
| `/account` | Profile settings (username, avatar), account deletion |
| `/admin` | Valence CMS admin panel (admin role only) |

---

## Features

### Authentication
- Session-based auth with Argon2id password hashing
- Two roles: `admin` (CMS access) and `user`
- HttpOnly session cookies, auto-expiry
- Self-registration, profile editing, soft-delete accounts

### Server Configuration Editor
- **Basic Server Settings:** name, IP, ports, slot count, voice/text chat
- **Game Settings:** 32 tunable factors (health, mana, stamina, XP, enemy stats, durations, etc.)
- **Presets:** Default, Relaxed, Hard, Survival, Custom — each defines a complete game settings override
- **User Groups:** In-game permission groups (kick/ban, inventory, base edit/extend, reserved slots)
- **Per-field controls:** Range sliders with percentage display, duration calculators, select dropdowns

### Sharing & Discovery
- "Share Publicly" toggle on any config
- Browse page: search by name, filter by preset
- Config tiles show creator username + avatar
- Clone any shared config to your library (deep copy, new ownership)
- Export configs as JSON for the Enshrouded dedicated server

### First-Party Analytics (Valence Telemetry)
- No third-party scripts
- `data-telemetry-type` + `data-telemetry-target` HTML attributes on interactive elements
- Ring buffer + `navigator.sendBeacon()` flush every 10s
- Server ingestion into `sessions` + `events` tables
- 14+ instrumented elements across auth, editor, browse, account flows
- Save-failure tracking for identifying friction points
- Admin analytics dashboard at `/admin/analytics`

### Admin Panel
- Full CRUD for all collections via Valence CMS
- User management (create, edit roles, view activity)
- Content moderation (feature/unfeature configs)
- Analytics dashboard

---

## API Endpoints

### Custom Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/users/me` | Yes | Full user profile (username, email, avatarUrl, role) |
| `POST` | `/api/users/register` | No | Self-registration |
| `PATCH` | `/api/account` | Yes | Update username/avatar |
| `DELETE` | `/api/account` | Yes | Soft-delete account, orphan configs, destroy sessions |
| `POST` | `/api/server-configs/:id/clone` | Yes | Clone config with new ownership |
| `POST` | `/api/telemetry` | No | Ingest analytics events |

### Auto-Generated (Valence CMS)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET/POST` | `/api/server-configs` | List (with filters: `?owner=`, `?shared=`, `?featured=`) / Create |
| `GET/PATCH/DELETE` | `/api/server-configs/:id` | Read / Update / Delete |
| `POST` | `/api/users/login` | Auth login (returns session cookie) |
| `POST` | `/api/users/logout` | Auth logout (clears session) |

---

## Database (PostgreSQL)

| Table | Purpose |
|-------|---------|
| `users` | User accounts (username, email, password_hash, avatarUrl, role) |
| `server-configs` | Config records (server JSONB, gameSettings JSONB, userGroups JSONB, owner, shared) |
| `cms_sessions` | Auth session storage |
| `sessions` | Telemetry sessions |
| `events` | Telemetry events (category, DOM target, JSONB payload) |
| `daily_summaries` | Pre-aggregated analytics |
| `document_revisions` | CMS content versioning |

**9 migrations** (001-009) track schema evolution from initial posts template through server-configs, sessions, username rename, avatar/sharing fields, and generated column cleanup.

---

## File Structure

```
enshrouded-server-config/
├── server.ts                    # HTTP server, custom routes, telemetry
├── valence.config.ts            # Collection schemas, DB config, telemetry
├── package.json
├── tsconfig.json
├── migrations/                  # 9 SQL migrations
├── public/
│   ├── css/                     # 7 stylesheets (~18KB)
│   │   ├── global.css           # Design system
│   │   ├── auth.css, home.css, browse.css, config-new.css, editor.css, account.css
│   └── js/                      # 11 ES modules (~80KB)
│       ├── nav.js               # Auth state + nav rendering
│       ├── telemetry-init.js    # Analytics client
│       ├── presets.js           # Game settings presets + field metadata
│       ├── home.js, login.js, signup.js, account.js
│       ├── config-new.js, editor.js
│       └── browse.js, browse-detail.js
└── src/pages/                   # 8 HTML pages
    ├── home/ui/index.html
    ├── auth/ui/{login,signup}.html
    ├── account/ui/index.html
    ├── config/ui/{new,editor}.html
    └── browse/ui/{index,detail}.html
```

---

## Valence Framework Integration

This app demonstrates Valence CMS capabilities:

| Feature | How Used |
|---------|----------|
| **Collection schema** | `server-configs` with nested groups, relations, JSON fields |
| **Auth system** | Session-based login/logout with dynamic display field resolution |
| **Admin panel** | Full CRUD at `/admin` with role-based access |
| **REST API** | Auto-generated CRUD with query param filtering |
| **Telemetry** | First-party analytics with event delegation + beacon ingestion |
| **Migrations** | `valence migrate` CLI for schema management |
| **Field types** | text, slug, number, boolean, select, group, json, relation |

---

## Environment

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=enshrouded_config
DB_USER=postgres
DB_PASSWORD=
PORT=3000
CMS_SECRET=change-me
```

## Quick Start

```bash
pnpm install
pnpm migrate
pnpm user:create    # create admin user
pnpm dev            # http://localhost:3000
```
