# Test-Driven Development (Flint)

> Adapted from obra/superpowers. Core principle: **Write the test first. Watch it fail. Write minimal code to pass.**

## The Iron Law
No production code before a failing test. If you write code first, delete it and start over. No exceptions without explicit human approval.

## RED-GREEN-REFACTOR

**RED:** Write one minimal test demonstrating the required behavior
- Clear test name describing the behavior
- Test real code, not mocks where possible
- One behavior per test
- For Flint: TypeScript unit tests for scoring logic; migration tests via `npm run db:validate`

**GREEN:** Write the simplest code that passes the test
- No over-engineering
- No extra features beyond what the test requires
- Don't refactor other code

**REFACTOR:** Clean up while keeping tests green
- Remove duplication
- Improve naming
- Extract helpers

## Flint testing patterns

| What to test | How |
|---|---|
| Scoring logic | Pure function unit tests — scoring is testable in isolation |
| RLS policies | `supabase db reset` + manual role-switching queries |
| TypeScript types | `npm run typecheck` / `tsc --noEmit` |
| Migration integrity | `npm run db:validate` |
| Dealbreaker logic | Unit tests with edge cases (null values, all-zero weights) |

## Red Flags (restart required)
- Writing code before the test
- Test passes on first run without you having implemented anything
- "I'll test after" reasoning
- Keeping code "as reference" while writing tests around it

## Flint-specific note
Safety flows (`blocks`, `reports`) and billing (`flint_premium_unlocks`, `spark_credit_transactions`) **must** have regression tests before any change is considered done.
