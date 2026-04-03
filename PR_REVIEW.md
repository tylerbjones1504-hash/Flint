# PR Review Guide

## What Cursor should optimize for

- Small, reversible changes.
- Clear explanations of what changed.
- Reuse of project patterns.
- Minimal blast radius.

## Reviewer checklist

- Does this preserve product intent?
- Does it protect safety, privacy, and moderation behavior?
- Are auth, billing, and schema changes explicitly called out?
- Are tests updated for meaningful logic changes?
- Are loading, error, and empty states handled?
- Is mobile UX still clean and accessible?

## Red flags

- Hidden dependency additions.
- Quiet changes to matching or monetization behavior.
- Weakening reporting, blocking, or visibility controls.
- Large refactors with unclear user benefit.
- New abstractions without demonstrated need.
