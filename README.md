# Flint

> *Strike something real.*

Flint is a compatibility-first dating app for **adults 18+** in the **United States and Canada**. The product is inclusive across demographics, with extra emphasis on **college communities** and **people in their 20s and 30s**—without closing the door to anyone who fits the values and regions above.

The backend is **Supabase** (PostgreSQL + Auth + Storage + Realtime).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Database | Supabase / PostgreSQL 15 |
| Auth | Supabase Auth (email + phone SMS) |
| Storage | Supabase Storage (profile photos) |
| Realtime | Supabase Realtime (messages) |
| Type safety | TypeScript + generated DB types |
| Future ML | pgvector (embeddings for compatibility) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker Desktop](https://docs.docker.com/desktop/) for Windows or macOS (Linux: Docker Engine + Compose). WSL2 backend is fine on Windows.
- [Supabase CLI](https://supabase.com/docs/guides/cli) — this repo uses the CLI from **`npm install`** (`npx supabase` / `node_modules/.bin`).
- A hosted Supabase project ([supabase.com](https://supabase.com)) only if you deploy or use `db push` against remote.

### Step 1 — Validate the database locally

Do this once after cloning (and anytime you change migrations) to confirm SQL applies cleanly and types still compile.

1. **Start Docker Desktop** and wait until it is fully running (`docker version` should work in a new terminal).
2. From the repo root:

```bash
npm install
npm run supabase:start
```

First run downloads images and can take several minutes.

3. **Apply all migrations and seeds** and **typecheck** against the hand-maintained types in `src/types/database.ts`:

```bash
npm run db:validate
```

That runs `supabase db reset` then `tsc --noEmit`. If a migration fails, fix the SQL and retry. If TypeScript fails after a schema change, either update `src/types/database.ts` by hand or run a full sync:

```bash
npm run db:validate:full
```

That also runs `supabase gen types typescript --local > src/types/database.ts` (overwrites the file — you may need to re-apply tweaks like `faith_subgroups.Insert: never`).

**Common issues**

- `open //./pipe/docker_engine` / “Docker Desktop is a prerequisite” — Docker is not running or not installed; start Docker and retry.
- `docker: command not found` — Install Docker Desktop and ensure **Use Docker Compose V2** / PATH includes the Docker CLI (restart the terminal after install).
- CLI warns *no SMS provider* — expected for local dev until you configure `[auth.sms.twilio]` (or another provider) in `supabase/config.toml`.

### Local development (ongoing)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Start local Supabase stack (Docker required)
npm run supabase:start

# 4. Apply migrations + seed data (destructive to local DB)
npm run supabase:reset

# 5. (Optional) Regenerate TypeScript types from local DB
npm run supabase:types
```

### Deploying migrations to production

```bash
npm run supabase:migrate
```

---

## Database Schema Overview

| Table | Purpose |
|---|---|
| `profiles` | User profiles (extends `auth.users`; optional `faith_subgroup_id` → `faith_subgroups`) |
| `profile_photos` | Photos (min 3, max 8 per profile) |
| `faith_subgroups` | Optional denomination/subgroup labels per top-level `faith` (seeded reference) |
| `prompt_templates` | Standard + Flint-branded prompts |
| `profile_prompts` | User's chosen prompt/answer pairs (max 3) |
| `user_preferences` | Age range, distance, dealbreakers, scoring weights |
| `likes` | Likes and passes between users |
| `matches` | Confirmed mutual likes with compatibility score |
| `conversations` | One conversation per match |
| `messages` | Individual messages |
| `commons_prompts` | Icebreaker prompt templates |
| `commons_answers` | User answers (revealed when both respond) |
| `compatibility_scores` | Cached pairwise scores |
| `spark_credit_balances` | Current Spark Credit balance per user |
| `spark_credit_transactions` | Full credit ledger |
| `flint_premium_unlocks` | Validated Flint Premium purchase / unlock records (receipt validation should run **server-side** before `INSERT`) |
| `blocks` | Blocked user pairs |
| `reports` | User safety reports |

### Flame Tiers

Compatibility scores are translated into **flame tiers** which drive the visual UI:

| Tier | Score | Label |
|---|---|---|
| Ash | 0–30% | Not your usual type |
| Smoke | 31–50% | Some common ground |
| Ember | 51–68% | Real overlap |
| Blaze | 69–84% | Strongly aligned |
| ⚡ Strike | 85%+ | Rare kind of connection |

Only **Strike** tier activates the amber glow treatment and full spark match animation.

### Matching Rules

- **Spark** is the **only** launch matching mode.
- **Heterosexual** matches (man + woman): both people get a **nudge** to start the chat in the UI; **either person may send a message at any time** (no permission lock).
- **Same-sex** matches (man + man, woman + woman): the **first liker** gets the primary nudge; either may still message.
- **Other gender combinations:** open either way in the UI (no primary nudge unless product adds one later).

The column `matches.nudged_profile_id` stores who gets the **primary nudge** when applicable; it is **not** a server-side gate on inserts into `messages` (RLS allows both participants to send).

### Relationship Mode

When two matched users both activate Relationship Mode:

- Their profiles are hidden from discovery.
- Their daily match queue is paused.
- The conversation enters a focused "just the two of you" state.

This is a **free** feature — it is the app's statement of values.

### Geography (MVP)

- **Launch markets:** U.S. and Canada only.
- **`profiles.location_country`** is free text with a default of `US`; **enforce the allow-list in the app** (and in any Edge/API validation) rather than hard-coding every locale variant in SQL.
- Helpers: `src/lib/launchMarkets.ts` (`normalizeLaunchCountryCode`, `isLaunchMarketCountryCode`). Optional env: `NEXT_PUBLIC_LAUNCH_COUNTRY_CODES` (see `.env.example`).

### Faith subgroups

- Top-level `faith` is an enum on `profiles`. Optional **subgroup** is `profiles.faith_subgroup_id` → `faith_subgroups` (`parent_faith`, `slug`, `label`). A trigger ensures the subgroup row matches the profile’s current `faith`.
- Rows are **seeded** in migration `006` (full Christian list; lighter sets for Muslim, Jewish, Hindu, Buddhist, Spiritual). Expand with new migrations as needed.
- `not_religious` has no subgroup rows; leave `faith_subgroup_id` null.

### Verification (planned)

- Baseline auth remains **email + phone (SMS)** via Supabase.
- **`.edu` / student verification** is intended to run through **SheerID** (or equivalent), driving a **combination** of benefits (e.g. badge, pricing, discovery)—product to finalize. Until wired, `profiles.is_verified` is the simple flag other features can key off.

---

## Project Structure

```
├── supabase/
│   ├── config.toml               # Supabase CLI config
│   └── migrations/
│       ├── ...000_initial_schema.sql   # Profiles, photos, preferences, prompts
│       ├── ...001_matches_messaging.sql # Likes, matches, messages, commons, credits
│       ├── ...002_rls_policies.sql     # Row Level Security
│       ├── ...003_seed_data.sql        # Prompt templates + commons prompts
│       ├── ...004_product_alignment.sql # Faith v2, no monogamy, renames, guards
│       ├── ...005_expand_prompt_templates.sql
│       └── ...006_faith_subgroups.sql
├── src/
│   ├── lib/
│   │   ├── supabase.ts           # Typed Supabase client
│   │   ├── launchMarkets.ts      # US/CA launch country helpers
│   │   └── scoring.ts            # Rules-based compatibility scoring
│   └── types/
│       └── database.ts           # TypeScript types matching the schema
├── REPO_AUDIT_CHECKLIST.md       # Product/schema audit tracker
├── .env.example
└── package.json
```

---

## Scoring Model (Phase 1 — Rules-based)

The scoring engine in `src/lib/scoring.ts` uses weighted preference matching:

1. **Relationship goal** (default weight: 30)
2. **Faith** (default weight: 20, with importance modifier; optional `faith_subgroup_id` can **slightly** reduce the faith component when top-level matches but chosen subgroups differ)
3. **Politics** (default weight: 20, 5-step spectrum distance; softer **display** strings live in `POLITICS_DISPLAY_LABELS`, enums unchanged)
4. **Lifestyle** (default weight: 10, placeholder until lifestyle data exists)
5. **Values / personality** (default weight: 10, neutral placeholder for future signals)
6. **Distance** (default weight: 10, **haversine** km when lat/lng exist; candidates beyond `max_distance_km` are **filtered out** before scoring)

Hard **dealbreakers** on goals, faith, and politics run **before** scoring. Weights are per-user in `user_preferences` and normalized in code.

**Phase 2** will layer in [pgvector](https://github.com/pgvector/pgvector) embeddings for semantic matching on prompt answers and bio text.
