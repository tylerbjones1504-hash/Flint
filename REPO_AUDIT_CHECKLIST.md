# Flint repo audit checklist

Track alignment between product decisions, docs, schema, and app code. Update statuses as work lands.

| # | Area | Item | Status |
|---|------|------|--------|
| 1 | Product copy | README: 18+ only; primary markets **U.S. & Canada** (country list enforced in app, not DB `CHECK`) | Done |
| 1b | Product copy | README: audience — inclusive; emphasize college + 20s–30s without excluding others | Done |
| 1c | Product copy | README: **Spark** as only launch match mode | Done (was already) |
| 2 | Messaging UX | Hetero: **nudge both** in UI; either may message. Same man/man or woman/woman: nudge first liker. No send gates from nudge. | Done |
| 3 | Scoring | Remove monogamy from MVP (DB, prefs, `scoring.ts`) | Done |
| 4 | Scoring | Weights: relationship goal, faith, politics, lifestyle + **values** placeholder + **distance** (haversine); dealbreakers pre-filter | Done |
| 5 | Faith | Top-level enum: 7 groups | Done |
| 5b | Faith | **`faith_subgroups`** reference table + seeds; **`profiles.faith_subgroup_id`** + trigger vs `faith` | Done |
| 5c | Faith | Subgroup mismatch: **slight** reduction to faith component when both set and differ | Done |
| 6 | Politics | Keep DB enum; softer **display** labels in `POLITICS_DISPLAY_LABELS` | Done |
| 7 | Premium | Table `flint_premium_unlocks`; remove MatchBox naming in docs | Done |
| 8 | Likes | No self-like (`CHECK actor_id <> target_id`) | Done |
| 9 | Photos | Min 3 / max 8; **delete** blocked if would drop below 3 | Done (delete trigger) |
| 10 | Prompts | ≥15 standard + ≥15 Flint-branded seeds | Done |
| 11 | Verification | Document **SheerID** + combo; `profiles.is_verified`; `.env.example` placeholders | Done (docs + env stub) |
| 12 | Relationship goals | Keep DB enum (`serious`, `casual`, `open`, `not_sure`); label in UI only if needed | N/A |
| 13 | RLS | Reviewed: `user_preferences` client-only; discovery tables respect blocks; messages/conversations match-participant-only; `faith_subgroups` read-only for clients | Reviewed |
| 14 | Types / RPC | `create_match(..., p_nudged_profile)`; `Database` uses `flint_premium_unlocks` | Done |
| 15 | Tooling | `supabase/config.toml` valid for current CLI (`project_id`, no invalid `auth.sms` keys) | Done |
| 16 | App helpers | `src/lib/launchMarkets.ts` for US/CA normalization | Done |

**Legend:** Done · Partial · Todo · Reviewed · N/A

## Follow-up (needs runtime / product)

- [ ] **SheerID:** Implement API + webhook; set `is_verified` and entitlements (badge / pricing / filters) per product spec.
- [ ] **Receipts:** Server route or Edge Function to validate App Store / Play billing → insert `flint_premium_unlocks`.
- [ ] **SMS:** Enable a provider under `[auth.sms.twilio]` (or other) in `config.toml` when testing phone auth locally (CLI may warn until then).
- [ ] **Docker:** Local `supabase db reset` requires Docker Desktop running on this machine.
- [ ] **Call sites outside this repo:** Mobile or other packages must use `flint_premium_unlocks`, `nudged_profile_id`, `p_nudged_profile`, and `faith_subgroup_id` (this repo has no additional references).
