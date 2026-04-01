# Flint

> *Strike something real.*

Flint is a compatibility-first dating app for college-age users built around one central metaphor: two pieces of flint striking to create fire. The backend is powered by **Supabase** (PostgreSQL + Auth + Storage + Realtime).

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
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- A Supabase project ([supabase.com](https://supabase.com))

### Local development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Start local Supabase stack (Docker required)
npm run supabase:start

# 4. Apply migrations + seed data
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
| `profiles` | User profiles (extends `auth.users`) |
| `profile_photos` | Photos (min 3, max 8 per profile) |
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
| `premium_unlocks` | One-time MatchBox Premium purchase records |
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

- **Spark mode** is the primary (and launch) matching mode.
- In heterosexual pairings, the **man messages first**.
- In same-sex pairings, the **person who liked first** gets the nudge to message.
- In all other gender combinations, **either can message**.

### Relationship Mode

When two matched users both activate Relationship Mode:

- Their profiles are hidden from discovery.
- Their daily match queue is paused.
- The conversation enters a focused "just the two of you" state.

This is a **free** feature — it is the app's statement of values.

---

## Project Structure

```
├── supabase/
│   ├── config.toml               # Supabase CLI config
│   └── migrations/
│       ├── ...000_initial_schema.sql   # Profiles, photos, preferences, prompts
│       ├── ...001_matches_messaging.sql # Likes, matches, messages, commons, credits
│       ├── ...002_rls_policies.sql     # Row Level Security
│       └── ...003_seed_data.sql        # Prompt templates + commons prompts
├── src/
│   ├── lib/
│   │   ├── supabase.ts           # Typed Supabase client
│   │   └── scoring.ts            # Rules-based compatibility scoring
│   └── types/
│       └── database.ts           # TypeScript types matching the schema
├── .env.example
└── package.json
```

---

## Scoring Model (Phase 1 — Rules-based)

The initial scoring engine in `src/lib/scoring.ts` uses weighted preference matching across five categories:

1. **Relationship goal** (default weight: 30)
2. **Monogamy preference** (default weight: 15)
3. **Faith** (default weight: 20, with importance modifier)
4. **Politics** (default weight: 20, spectrum distance)
5. **Lifestyle** (default weight: 15, placeholder until lifestyle data collected)

Weights are per-user and stored in `user_preferences`. Hard dealbreakers filter candidates out before scoring runs.

**Phase 2** will layer in [pgvector](https://github.com/pgvector/pgvector) embeddings for semantic matching on prompt answers and bio text.
