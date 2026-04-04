# Finishing a Development Branch (Flint)

> Adapted from obra/superpowers. Announce at start: "I'm using the finishing-a-branch skill."

## Step 1: Verify tests pass
```bash
npm run typecheck        # TypeScript must pass
npm run db:validate      # If schema changed
npm test                 # If test suite exists
```

If anything fails — **stop**. Fix before presenting options. Do not proceed with failing verification.

## Step 2: Determine base branch
```bash
git merge-base HEAD main 2>/dev/null
```
Base branch is `main` for Flint.

## Step 3: Present exactly these 4 options
```
Implementation complete. Verification passed. What would you like to do?

1. Merge back to main locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

## Step 4: Execute choice

**Option 1 — Merge locally:**
```bash
git checkout main && git pull && git merge <feature-branch>
npm run typecheck   # Verify on merged result
git branch -d <feature-branch>
```
Then cleanup worktree.

**Option 2 — Push + PR:**
```bash
git push -u origin <feature-branch>
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets>

## Verification
- [ ] typecheck passes
- [ ] db:validate passes (if schema changed)
- [ ] Safety flows verified (if applicable)
- [ ] RLS policies verified (if applicable)
EOF
)"
```
Keep worktree until PR merges.

**Option 3 — Keep as-is:**
Report: "Keeping branch `<name>`. Worktree preserved at `<path>`."
Do NOT cleanup worktree.

**Option 4 — Discard:**
Require typed `discard` confirmation first. Then:
```bash
git checkout main
git branch -D <feature-branch>
```
Then cleanup worktree.

## Step 5: Cleanup worktree (Options 1 and 4 only)
```bash
git worktree remove <worktree-path>
```

## Flint-specific PR checklist
- [ ] No secrets or `.env` values in diff
- [ ] Safety/moderation flows untouched (or explicitly reviewed)
- [ ] Migration history intact
- [ ] `src/types/database.ts` consistent with schema if changed
