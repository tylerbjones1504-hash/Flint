# Writing Plans (Flint)

> Adapted from obra/superpowers. Purpose: create detailed implementation plans before any code is written.

## Core Requirement
Plans assume the implementer has zero context for the Flint codebase. Every step must be concrete and actionable — **no placeholders**.

## Where to save
```
docs/plans/YYYY-MM-DD-<feature-name>.md
```

## Plan structure

```markdown
# Plan: <Feature Name>
**Date**: YYYY-MM-DD
**Author**: <agent or human>
**Status**: DRAFT | APPROVED | IN PROGRESS | DONE

## Context
<What problem does this solve? Why now?>

## Scope
<Exact files that will change>
<Files that will NOT change>

## Pre-conditions
<What must be true before this starts>
<Schema state, feature flags, approvals needed>

## Tasks
Each task: 2–5 min of focused work, follows TDD

### Task 1: <Name>
**Files**: `path/to/file.ts`
**Steps**:
1. Write failing test: `<exact test name>`
2. <exact code to write, no placeholders>
3. Run: `npm run typecheck`
4. Expected: <exact output>

### Task 2: ...

## Verification
<How to prove the whole thing works end-to-end>

## Rollback
<How to undo this if something goes wrong>
<Is the migration reversible? What data is at risk?>
```

## Hard rules
- No `TBD`, `TODO`, `implement later`, or `see above`
- Every code step shows actual code, not descriptions of code
- Every migration step specifies the exact SQL
- Rollback section is mandatory for any schema change

## Flint-specific pre-conditions to always check
- [ ] Does this touch auth flows? → human approval required
- [ ] Does this change RLS policies? → specialist-supabase must review
- [ ] Does this affect safety flows? → specialist-safety must review
- [ ] Is this migration additive-only? → verify before writing plan
- [ ] Are TypeScript types staying in sync? → plan the `db:validate:full` step

## After writing
Present to human for approval. Then route to `subagent-driven-development` or `builder`.
