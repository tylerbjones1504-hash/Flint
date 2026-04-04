# CLAUDE.md — Flint

## Core rules
- Never commit directly to `main` or `master`. Use feature branches.
- Never modify `.claude/agents/` or `.claude/settings.json` without explicit human approval.
- Tests must pass before any work is considered complete.
- Prefer small, reviewable diffs over large sweeping changes.
- All significant decisions must be logged; ephemeral reasoning is not enough.
- Read `AGENTS.md` for product principles, UX guidance, and "ask before / never do" rules.

## Product context
Flint is a compatibility-first dating app (iOS/Android) for adults 18+ in the US and Canada.
Backend: Supabase (PostgreSQL 15 + Auth + Storage + Realtime). Type safety via TypeScript.
Safety, consent, and privacy are non-negotiable product values — not features that can be traded off.

## How to delegate
Use the agents in `.claude/agents/` for all non-trivial work:

| Need | Agent |
|---|---|
| Decompose + route a task | `orchestrator` |
| Challenge a plan before building | `critical-thinker` |
| Implement a scoped change | `builder` |
| Schema / migrations / RLS / Supabase | `specialist-supabase` |
| Compatibility scoring / matching engine | `specialist-scoring` |
| Safety / moderation / blocking / privacy | `specialist-safety` |
| Mobile product / onboarding / UX flows | `specialist-product` |
| TypeScript types / type generation | `specialist-typescript` |
| Post-implementation review | `reviewer` |
| Log lessons + trigger self-updates | `retrospective-coach` |

## Workflow chain (enforced by hooks)
```
critical-thinker → builder → reviewer → retrospective-coach
```
No step may be skipped. The hook in `.claude/settings.json` enforces this.

## Hard gates (from AGENTS.md — require explicit human approval before proceeding)
- Adding a new dependency
- Changing authentication flows
- Editing database schema or migrations
- Modifying subscriptions, billing, or paywalls
- Changing push notifications or messaging behavior
- Removing or weakening moderation, blocking, reporting, or privacy flows
- Deleting migration history
- Force-insecure defaults for speed

## Skills
Invoke skills in `.claude/skills/` for specific methodologies:

| Skill | When to use |
|---|---|
| `systematic-debugging` | Any bug — no fixes without root cause first |
| `test-driven-development` | Any new logic — test first, always |
| `writing-plans` | Before any non-trivial implementation |
| `verification-before-completion` | Before any completion claim |
| `subagent-driven-development` | Executing an approved plan via fresh subagents |
| `finishing-a-branch` | End of every feature branch |

## Learnings
Domain learnings live in `.claude/learnings/`. They are injected into context automatically
on `SessionStart` and `PostCompact`. Do not manually edit them mid-session;
let `retrospective-coach` manage writes.

| File | Domain |
|---|---|
| `general.md` | Cross-cutting patterns |
| `supabase.md` | PostgreSQL, RLS, migrations, auth, storage, realtime |
| `scoring.md` | Compatibility scoring, matching, dealbreakers, flame tiers |
| `safety.md` | Moderation, blocking, reporting, privacy |
| `product.md` | Mobile UX, onboarding, dating flows, copy |

## External resources (always available)
- **superpowers** (obra/superpowers) — source of the skills above; 14 total skills
- **ui-ux-pro-max-skill** (nextlevelbuilder) — BM25 design search: styles, palettes, fonts, UX guidelines, 16 stacks. Install: `npx uipro-cli init --ai claude`
- **claude-mem** (thedotmack) — persistent memory plugin with vector search across sessions
- **awesome-claude-code** (hesreallyhim) — curated catalog of hooks, commands, CLAUDE.md files, and skills
