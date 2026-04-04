# Subagent-Driven Development (Flint)

> Adapted from obra/superpowers. Purpose: execute implementation plans by dispatching fresh subagents per task with two-stage review.

## When to use
- You have a complete, approved Flint plan (`docs/plans/YYYY-MM-DD-*.md`)
- Tasks are mostly independent
- You need to stay in the current session (vs. parallel worktrees)

## Process

### Step 1: Extract all tasks upfront
Read the full plan. List every task with its context before dispatching anything.

### Step 2: Per task — dispatch implementer subagent
Give the subagent:
- The single task description (not the whole plan)
- Exact files in scope
- The relevant Flint learnings file content
- The TDD requirement (`systematic-debugging` + `test-driven-development` skills apply)

### Step 3: Spec compliance review
After implementer reports done — review against the plan's acceptance criteria.
Does the output match what was specified? Are all steps completed?

### Step 4: Code quality review
Check: TypeScript correctness, no `any`, RLS integrity (if applicable), safety flows intact, tests pass.

### Step 5: Iterate until both reviews pass
If issues found: dispatch a targeted fix, re-review. Don't accumulate multiple failing tasks.

### Step 6: Mark task complete, move to next

### Step 7: Final review of entire implementation
When all tasks done: run `verification-before-completion` skill across the whole change.
Then route to `finishing-a-branch`.

## Subagent status signals
- `DONE` — proceed to spec review
- `DONE_WITH_CONCERNS` — assess concerns before review
- `NEEDS_CONTEXT` — provide missing info and re-dispatch
- `BLOCKED` — reassess the plan, may need orchestrator re-plan

## Model allocation
- Mechanical implementation (simple CRUD, type updates) → `claude-haiku-4-5`
- Integration work (RLS + scoring + types together) → `claude-sonnet-4-6`
- Architecture decisions, safety design → `claude-opus-4-6`

## Flint rule
Safety-touching tasks always get a dedicated specialist-safety review before marking complete, regardless of the two-stage review passing.
