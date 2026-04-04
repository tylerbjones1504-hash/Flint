# Verification Before Completion (Flint)

> Adapted from obra/superpowers. Core mandate: **NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

## The Rule
Before saying "done", "complete", "fixed", "working", or any equivalent — you must run verification and show the output.

## What verification looks like

| Claim | Required evidence |
|---|---|
| "Tests pass" | Run `npm test` or equivalent, paste output |
| "Types are correct" | Run `npm run typecheck` or `tsc --noEmit`, paste result |
| "Migration works" | Run `npm run db:validate`, show success |
| "RLS is correct" | Show the policy text + mental model of who can access what |
| "Bug is fixed" | Reproduce the original error, then show it no longer occurs |
| "Scoring is correct" | Run the function with test inputs, show expected outputs |

## Violations (require restart)
- Asserting tests pass without running them
- Claiming a fix works without reproducing the original problem
- Using "should work", "probably fixed", "likely passes"
- Saying "Done!" before running anything
- Trusting your own previous output without re-verifying

## Flint-specific verification checklist
Before any work is called complete:
- [ ] `npm run typecheck` passes (or `tsc --noEmit`)
- [ ] If schema changed: `npm run db:validate` passes
- [ ] If RLS changed: verify both owner and non-owner access mentally
- [ ] If safety flows touched: reviewer must sign off
- [ ] If scoring changed: edge cases tested (all-zero weights, null values, dealbreaker hit)
- [ ] No `any` types introduced

## The phrase to use
"Here is the verification evidence:" followed by actual command output.

Never say "I believe this is complete" — show the proof.
