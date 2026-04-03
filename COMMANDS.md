# Commands

Exact commands for this repo so Cursor does not guess. Update this file when scripts or tooling change.

## Package manager

**Package manager:** npm (see `package-lock.json`).

## App development

| Task | Command |
|------|---------|
| Install | `npm install` |
| Start dev server | `npm run dev` |
| Production build | `npm run build` |
| Start production server | `npm run start` |

### Mobile native (iOS / Android)

The repository currently ships a **Next.js** web app. When iOS/Android clients (e.g. React Native, Expo) are added, document their commands here:

- Run iOS: _TBD_
- Run Android: _TBD_
- Start Expo (if used): _TBD_

## Quality

| Task | Command |
|------|---------|
| Lint | `npm run lint` |
| Format | _TBD_ (add Prettier or project formatter if adopted) |
| Typecheck | `npm run type-check` |
| Unit tests | _TBD_ |
| Integration tests | _TBD_ |
| E2E tests | _TBD_ |

## Backend (Supabase local)

Requires [Docker Desktop](https://docs.docker.com/desktop/) running. `supabase/config.toml` uses `project_id` and keys compatible with the current Supabase CLI (fix invalid `[project]` / `auth.sms.otp_expiry` issues if you upgrade CLI).

| Task | Command |
|------|---------|
| **Step 1 — validate migrations + typecheck** | `npm run db:validate` (after `npm run supabase:start`) |
| Same + regenerate `database.ts` from local DB | `npm run db:validate:full` |
| Start local stack | `npm run supabase:start` |
| Stop local stack | `npm run supabase:stop` |
| Reset local DB (destructive) | `npm run supabase:reset` |
| Apply migrations (linked project) | `npm run supabase:migrate` |
| Generate TypeScript types (local) | `npm run supabase:types` |

Workers/jobs and hosted API URLs depend on your Supabase/project setup; add explicit commands or links when finalized.

## Release

| Task | Command |
|------|---------|
| Build (web) | `npm run build` |
| Build iOS | _TBD_ |
| Build Android | _TBD_ |
| Ship staging | _TBD_ |
| Ship production | _TBD_ |

## Notes

- Keep these commands current.
- Replace `_TBD_` entries as soon as the stack is finalized.
