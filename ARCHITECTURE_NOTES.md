# Architecture Notes

## Principles

- Keep UI, business logic, and data access clearly separated.
- Reuse existing patterns before creating new ones.
- Use typed interfaces and explicit contracts where possible.
- Prefer small modules with obvious responsibilities.

## Suggested boundaries

- **Presentation layer:** screens, components, navigation, state wiring.
- **Domain layer:** matching, messaging, onboarding, subscriptions, moderation logic.
- **Data layer:** API clients, repositories, persistence adapters.
- **Platform layer:** push notifications, deep links, media, permissions.

## Sensitive systems

Treat these areas as high-risk and ask before major changes:

- Authentication and verification.
- Matching logic and ranking.
- Messaging permissions and delivery.
- Moderation and abuse-prevention workflows.
- Billing, subscriptions, and entitlements.
- Database schema and migrations.

## Review checklist

When changing architecture, confirm:

- The change matches existing patterns.
- State ownership is clear.
- Error handling is explicit.
- Tests cover meaningful logic.
- User privacy and safety are preserved.
