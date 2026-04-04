# Systematic Debugging (Flint)

> Adapted from obra/superpowers. Core principle: **NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

## The Four-Phase Process

### Phase 1: Root Cause Investigation
- Read the full error message — don't skim
- Reproduce the issue consistently before touching any code
- Review recent changes (`git log --oneline -20`)
- Gather diagnostic evidence: logs, stack traces, RLS query results, Supabase error codes
- For multi-component issues (e.g., RLS + client + scoring), instrument each boundary
- Trace data flow backward through the call stack to find the original source

### Phase 2: Pattern Analysis
- Find similar **working** code in the Flint codebase
- Study the working implementation completely
- Identify the **specific** difference between working and broken
- Check `supabase/migrations/` for schema assumptions that may have changed
- Check `.claude/learnings/` for prior lessons about this domain

### Phase 3: Hypothesis and Testing
- Form **one** specific hypothesis
- Test it with a **minimal** change — one variable at a time
- Verify before proceeding
- If you don't understand yet, say so — don't guess

### Phase 4: Implementation
- Write a failing test first (Flint: `npm run typecheck` + manual RLS test or unit test)
- Implement one fix addressing the root cause
- Verify the fix works end-to-end
- **If 3+ attempts have failed:** stop and escalate — this is an architectural problem

## Red Flags (you're doing it wrong)
- Proposing a "quick fix" without evidence
- Making multiple simultaneous changes
- Running the same failing command repeatedly
- Guessing at RLS policies without reading the migration

## Flint-specific debugging targets
| Symptom | Where to look first |
|---|---|
| User sees wrong rows | RLS policies in `002_rls_policies.sql` |
| Score seems wrong | `src/lib/scoring.ts` weight normalization |
| Type errors after migration | `src/types/database.ts` vs actual schema |
| Match not appearing | Dealbreaker logic in scoring + `likes` table state |
| Message send fails | RLS on `messages` — both participants must be allowed |

## Time benchmark
Systematic approach: 15–30 min. Random attempts: 2–3 hours + new bugs introduced.
