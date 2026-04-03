# AGENTS.md

## Project
Flint is a mobile dating app for iOS and Android.

Core goals:
- Build a trustworthy dating experience.
- Reduce friction in onboarding and matching.
- Prioritize safety, consent, privacy, and respectful communication.
- Favor maintainable, mobile-first implementation choices.

## Product principles
- Safety before growth tactics.
- Clarity before cleverness.
- Fast time-to-value for new users.
- Inclusive, respectful language throughout the product.
- Every feature should support trust, retention, or meaningful matches.

## Working style
- Make small, reversible changes.
- Prefer existing project patterns over new abstractions.
- Read nearby files before creating new architecture.
- Keep code modular, typed, and easy to review.
- Explain tradeoffs briefly when making structural decisions.
- Always feel free to ask for clarification on any task.

## Ask before
- Adding a new dependency.
- Changing authentication flows.
- Editing database schema or migrations.
- Modifying subscriptions, billing, or paywalls.
- Changing push notifications or messaging behavior.
- Introducing background jobs or third-party vendors.
- Refactoring large working areas with broad blast radius.

## Never do these without explicit approval
- Commit secrets, tokens, or `.env` values.
- Remove moderation, blocking, reporting, or privacy-related flows.
- Delete migration history.
- Disable analytics, audit, or compliance events if they already exist.
- Force insecure defaults for speed.

## Engineering rules
- Mobile-first always.
- Prefer simple components and clear state boundaries.
- Keep business logic out of UI where practical.
- Add or update tests when changing meaningful logic.
- Run lint, typecheck, and tests before finishing substantial changes.
- Preserve accessibility and readable tap targets.

## UX guidance
- Respect user intent.
- Reduce unnecessary profile setup friction.
- Do not use dark patterns for boosts, subscriptions, or matches.
- Use direct, warm, non-cringe copy.
- Keep onboarding focused on trust, profile quality, and first-match speed.

## Output expectations
When implementing features:
1. State the plan briefly.
2. Make the smallest useful change.
3. Reference existing files used as patterns.
4. Call out risks or follow-up work.
5. Do not invent hidden product decisions; ask when unclear.

## General guidelines
- Always feel free to ask for clarification on any task.
- Always feel free to ask for help on any task.


## Task breakdown
- When breaking down a task, always consider the following:
  - What is the smallest useful change?
  - What is the most efficient way to implement the change?
  - What is the most maintainable way to implement the change?
  - What is the most readable way to implement the change?
  - What is the most testable way to implement the change?
  - What is the most secure way to implement the change?
  - What is the most performant way to implement the change?
  - What is the most scalable way to implement the change?
  