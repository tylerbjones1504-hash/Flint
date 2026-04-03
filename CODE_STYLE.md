# Code Style

## General

- Prefer readable code over compact clever code.
- Choose explicit names for screens, hooks, services, and domain concepts.
- Keep functions focused and side effects obvious.
- Reuse existing patterns before creating a new abstraction.

## Structure

- Keep UI components presentational when practical.
- Move business rules into domain or service layers.
- Keep data-fetching and caching patterns consistent.
- Avoid giant files that mix UI, networking, and business logic.

## Error handling

- Handle failures deliberately.
- Return or surface actionable error states.
- Do not swallow errors silently.

## Testing

- Add tests when business logic changes.
- Update tests when behavior changes intentionally.
- Avoid brittle tests tied to unimportant implementation details.

## Reviews

- Make small diffs.
- Call out tradeoffs when choosing a new pattern.
- Leave follow-up notes for work intentionally deferred.
