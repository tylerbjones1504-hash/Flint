# Flint Cursor Setup

This repository contains the core files for guiding Cursor while working on Flint.

## Files

| File | Purpose |
|------|---------|
| [AGENTS.md](./AGENTS.md) | Global repo-level instructions. |
| [.cursor/rules/product.mdc](./.cursor/rules/product.mdc) | Product priorities and UX constraints. |
| [.cursor/rules/mobile-ui.mdc](./.cursor/rules/mobile-ui.mdc) | Mobile UI and interaction rules. |
| [.cursor/rules/backend-api.mdc](./.cursor/rules/backend-api.mdc) | Backend, API, auth, and data rules. |
| [.cursor/rules/safety-moderation.mdc](./.cursor/rules/safety-moderation.mdc) | Privacy, moderation, and abuse-prevention rules. |
| [.cursor/rules/testing.mdc](./.cursor/rules/testing.mdc) | Testing and QA expectations. |

Supporting reference docs (broader context, not loaded as rules by default):

- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
- [ARCHITECTURE_NOTES.md](./ARCHITECTURE_NOTES.md)
- [COMMANDS.md](./COMMANDS.md)
- [CODE_STYLE.md](./CODE_STYLE.md)
- [SAFETY_CHECKLIST.md](./SAFETY_CHECKLIST.md)
- [PR_REVIEW.md](./PR_REVIEW.md)
- [REPO_AUDIT_CHECKLIST.md](./REPO_AUDIT_CHECKLIST.md)

## Installation

1. Keep **AGENTS.md** in the repository root.
2. Keep all **`.mdc`** files in **`.cursor/rules/`**.
3. Reload Cursor or reopen the project if rules do not appear.
4. Keep rules focused; split or trim when they grow stale.

## Maintenance guidelines

- Prefer many small focused rules over one giant file.
- Keep permanent decisions here, not temporary sprint notes.
- Update a rule when the agent repeats a mistake more than once.
- Remove stale guidance when architecture changes.
