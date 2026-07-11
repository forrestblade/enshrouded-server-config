# Enshrouded Config Hub — Build Spec + Vision

## Overview

A full stack web application for creating, managing, and sharing Enshrouded dedicated server configurations. Built on Valence CMS as a real world stress test of the framework across user accounts, interactive UI, community content, and telemetry.

**Stack:** Node.js + TypeScript, PostgreSQL, Valence CMS v0.9.0, vanilla HTML/CSS/JS (no bundler)

---

## Why This Exists (For Valence)

This is the second real world project built on Valence, intentionally different from the personal blog/garden. The blog tests the writing and publishing pipeline. This tests everything else: complex relational content models, user generated content, interactive UI components beyond forms, community features, search and filtering, account management with data lifecycle, and first party telemetry in a production context.

Every feature maps to a Valence subsystem that needs real world validation.

| App Feature | Valence Subsystem Tested |
|---|---|
| Config editor (sliders, live preview, grouped sections) | ValElement Web Components, JS islands, form handling |
| Preset selector (lock/unlock fields) | Conditional field display, dynamic UI state |
| Config CRUD with structured JSON fields | CMS JSON field handling, schema validation, Zod integration |
| Browse page (search, filter, sort, paginate) | Admin search/filtering applied to public facing pages |
| User accounts (registration, sessions, settings, deletion) | Auth system, access control, CSRF, session management |
| Avatar upload | Media pipeline, image processing, storage adapters |
| Clone / fork (deep copy with new ownership) | Relation handling, data duplication patterns |
| Telemetry instrumentation (14+ elements) | Ring buffer, beacon ingestion, daily summaries, admin dashboard |
| Admin panel with role gating | Role based access control, CMS admin extensibility |
| Soft delete accounts with config orphaning | Data lifecycle, cascade behavior |
| OG meta tags per config (future) | Server rendered HTML, dynamic meta generation per route |
| Tags system (future) | Many to many relations, denormalized counts, search indexing |
| Public user profiles (future) | Schema driven route generation, public vs private field access |
| Full text search across configs (future) | PostgreSQL tsvector at the application layer |

---

## What's Built (Current State)

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard: hero + "My Configurations" list |
| `/login` | Email/password login |
| `/signup` | User registration |
| `/browse` | Browse shared configs with search + preset filter |
| `/browse/:id` | Config detail: read only view, export JSON, clone |
| `/config/new` | Create config (name + preset) |
| `/config/:id` | Full config editor (server, game, user groups) |
| `/account` | Profile settings (username, avatar), account deletion |
| `/admin` | Valence CMS admin panel (admin role only) |

### Authentication

- Session based auth with Argon2id password hashing
- Two roles: `admin` (CMS access) and `user`
- HttpOnly session cookies, auto expiry
- Self registration, profile editing, soft delete accounts

### Server Configuration Editor

- **Basic Server Settings:** name, IP, ports, slot count, voice/text chat
- **Game Settings:** 32 tunable factors (health, mana, stamina, XP, enemy stats, durations, etc)
- **Presets:** Default, Relaxed, Hard, Survival, Custom. Each defines a complete game settings override.
- **User Groups:** In game permission groups (kick/ban, inventory, base edit/extend, reserved slots)
- **Per field controls:** Range sliders with percentage display, duration calculators (nanosecond to human readable conversion), select dropdowns

Critical UX detail: time values in the actual JSON are nanoseconds (e.g. `600000000000` = 10 minutes). The editor displays and accepts human readable values and converts on export. Factor values have range validation because the Enshrouded server silently clamps out of range values. The editor warns instead of silently clamping.

### Sharing & Discovery

- "Share Publicly" toggle on any config
- Browse page: search by name, filter by preset
- Config tiles show creator username + avatar
- Clone any shared config to your library (deep copy, new ownership)
- Export configs as JSON for the Enshrouded dedicated server

### First Party Analytics (Valence Telemetry)

- No third party scripts
- `data-telemetry-type` + `data-telemetry-target` HTML attributes on interactive elements
- Ring buffer + `navigator.sendBeacon()` flush every 10s
- Server ingestion into `sessions` + `events` tables
- 14+ instrumented elements across auth, editor, browse, account flows
- Save failure tracking for identifying friction points
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
| `POST` | `/api/users/register` | No | Self registration |
| `PATCH` | `/api/account` | Yes | Update username/avatar |
| `DELETE` | `/api/account` | Yes | Soft delete account, orphan configs, destroy sessions |
| `POST` | `/api/server-configs/:id/clone` | Yes | Clone config with new ownership |
| `POST` | `/api/telemetry` | No | Ingest analytics events |

### Auto Generated (Valence CMS)

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
| `daily_summaries` | Pre aggregated analytics |
| `document_revisions` | CMS content versioning |

9 migrations (001-009) track schema evolution from initial posts template through server configs, sessions, username rename, avatar/sharing fields, and generated column cleanup.

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

| Feature | How Used |
|---------|----------|
| **Collection schema** | `server-configs` with nested groups, relations, JSON fields |
| **Auth system** | Session based login/logout with dynamic display field resolution |
| **Admin panel** | Full CRUD at `/admin` with role based access |
| **REST API** | Auto generated CRUD with query param filtering |
| **Telemetry** | First party analytics with event delegation + beacon ingestion |
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

---

## Vision: What's Next

Everything above is built or in progress. Everything below is the roadmap for turning this from a functional tool into a community product. These features also happen to exercise the exact Valence subsystems that need stress testing before 1.0.

### Config Forking (Upgrade Clone)

Cloning already works. Forking adds attribution. When you clone a shared config, the new copy carries a "forked from" link back to the original. The original author's profile shows fork count. Fork chains are visible. This is Git fork semantics applied to game configs.

**New fields on `server-configs`:** `forkedFrom` (self relation, optional), `forkCount` (number, denormalized).

**Valence test surface:** Self referential relations, lifecycle hooks for incrementing denormalized counters on the source config.

### Diff from Default

Every config profile page shows an auto generated one liner summary of what changed from the Default preset. "3x mining speed, 2x XP, enemies disabled, 30 min starvation timer" tells you more than 32 individual settings. Computed server side from the stored gameSettings JSONB compared against the default preset values.

This is probably the single highest value UX improvement for the browse page. Config tiles in the browser show the diff summary instead of (or alongside) the preset name.

**Valence test surface:** Server side computed views, template rendering with dynamic content.

### Tags

Curated tags (PvE, Hardcore, Builder, Relaxed, Vanilla+, Speedrun, RP) plus user created tags on publish. Many to many relation. Tags get a usage count (denormalized) for sorting. Browse page gets multi select tag filtering.

**New collection:** `tags` (name, slug, isCurated boolean, usageCount).
**New relation:** `server-configs` to `tags`, many to many.

**Valence test surface:** Many to many relations (the CMS doesn't have a dedicated join table field type yet, so this will force the pattern), denormalized counters, search index integration.

### Likes

Simple. Heart button on config profiles. One like per user per config. Like count displayed on browse tiles and profile pages. Sorted by most liked in the browser.

**New collection:** `likes` (user relation, config relation, createdAt). Unique constraint on user + config pair.

**Valence test surface:** Join table pattern, concurrent write safety on the denormalized likeCount field, unique constraint enforcement.

### Config Version History

When you edit and save a config, the previous state is snapshotted into an immutable `config_versions` table. The config profile page shows version history. You can view or download any previous version. Optional changelog text per version.

**New collection:** `config_versions` (config relation, version number, serverSettings JSON snapshot, gameplaySettings JSON snapshot, userGroups JSON snapshot, changelog text, createdAt).

**Valence test surface:** Append only data patterns, revision system at the application level (not CMS level), immutable records.

### Config Comparison

Pick two configs from the browser. Side by side view highlights every setting that differs. Color coded: green for values better than default, red for values harsher than default (subjective, but a reasonable heuristic for PvE players). Useful for deciding between community configs.

**New route:** `/compare?a=:id&b=:id`

**Valence test surface:** Multi parameter query routing, server side data processing, complex template rendering.

### Config Import

Upload your existing `enshrouded_server.json`. The builder parses it, validates every field, and loads it into the editor. Drag and drop or file picker. Parse errors shown inline with the specific JSON issue highlighted. This is the fastest onramp for server operators who already have a config and want to share it or tweak it visually.

**New route:** `/config/import` or modal on `/config/new`

**Valence test surface:** File upload handling outside the media pipeline, JSON parsing and schema validation, error messaging UX.

### Public User Profiles

`/users/:username` shows the user's avatar, bio, join date, and all their published configs. Currently the only user facing page is `/account` (settings). Public profiles give authors an identity in the community.

**New fields on `users`:** `bio` (textarea, optional, max 500 chars).
**New route:** `/users/:username`

**Valence test surface:** Schema driven route generation (VAL-116), public vs private field access (email hidden, bio/avatar/username public).

### Content Moderation

Reports collection. Users can flag configs for spam, offensive content, or malicious settings (configs that would brick a server). Moderators review reports in the admin panel. Status workflow: pending, reviewed, actioned, dismissed.

**New collection:** `reports` (reporter relation, config relation, reason select, details textarea, status select, reviewedBy relation).

**Valence test surface:** Role based access control beyond admin/user (moderator role), field level access (VAL-131), admin panel extensibility for moderation workflows.

### OG Meta Tags and Embeds

Every config profile page generates proper Open Graph meta tags: config name, author, diff from default summary, preset badge. When someone shares a config URL in Discord or Reddit, the embed card shows useful info instead of a generic page title.

**Valence test surface:** Dynamic server rendered meta tags per route, template injection at the layout level.

### Account Deletion Upgrade

Current: soft delete, orphan configs, destroy sessions. Future: give the user a choice during deletion. Option A: anonymize configs (attributed to "Deleted User", configs stay public). Option B: delete everything (configs removed entirely). GDPR style data export (download all your data as JSON) before deletion.

**New route:** `/account/delete` (dedicated flow instead of inline button)
**New endpoint:** `GET /api/account/export`

**Valence test surface:** Data lifecycle management, cascade behavior options, GDPR compliance patterns.

---

## Design Direction

Clean, dark themed, game adjacent without being corny. No fake medieval fonts. No overproduced fantasy UI. Think modern tool that happens to serve a game community. The editor should feel like a well made settings panel, not a game launcher.

The landing page pitches the value prop in one line: "Build, share, and discover Enshrouded server configs. No JSON required." Browse is accessible without an account. Accounts are for publishing and saving.
