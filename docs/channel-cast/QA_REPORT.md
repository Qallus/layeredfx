# LayeredFX operations QA — 2026-09-10

Updated local integration checkpoint: see `../reviews/current-review.md`. Dependency installation, 97 tests, real typecheck/lint/production build and targeted browser checks now pass. The historical package report below predates those checks. Live Supabase, complete source parity and Docker validation remain unverified.

## Executed

- **79 Node tests passed; zero failures.** This includes the original six homepage-validator tests and 73 operations/security tests.
- Operations tests cover stable stage identity, required gates, skipped-stage/nurture bypass prevention, manual versus automatic checks, admin-only overrides with reasons, owner changes, lost/won/reopen history, idempotent conversion/handoff, forecasts, date boundaries, private-record filtering, editor/viewer permissions, folder boundaries, saved versions, safe document links and size limits, plan/task relation integrity, completion synchronization, membership/assignee limits, archive behavior, exact origin checks, bounded request bodies and stale revisions.
- Shared engine and security tests execute the actual modules imported by the React demo and server routes; they do not mock a separate business-rule implementation.
- **59 JavaScript/TypeScript source and test files parsed without syntax errors.** All discovered local import paths resolved at this checkpoint. This is a parser/import audit, not dependency-backed typechecking.
- Archive and file integrity are checked during final packaging; see FILE_MANIFEST.sha256 and MERGE_MAP.md.

## Not passed / not executed

Dependency installation was unavailable in the delivery environment. A full `tsc --noEmit` attempt reports missing Next/React/Plate dependencies and related cascading JSX/type errors. That is **not a passing typecheck**. No fabricated lockfile is included.

The following remain **unverified**:

- Complete dependency-backed typecheck, lint, production Next.js build and Docker build.
- Actual React/Radix component runtime and Plate 53 editor behavior.
- Live Three.js rendering in the Next.js app (unchanged from the earlier homepage verification boundary).
- Supabase authentication, token refresh, SQL migration, RLS behavior, PostgREST compare-and-swap, durable persistence and real multi-user access tests.
- Real-browser dashboard accessibility, mobile layout, native drag-and-drop, keyboard alternatives and unsaved-editor behavior.
- Load, operational backup/restore, distributed rate limits, monitoring and production penetration review.

The original HTML homepage's prior preview checks are historical; they do not validate the new React dashboard. No dashboard screenshot or static mock is substituted as proof of implementation.

## Release gate

Treat this as an integrated implementation package ready for local validation, not a deployed or security-certified production application. Follow SETUP.md and prompts/04-CODEX-OPERATIONS-REVIEW.md before using real customer data. Mark a check passed only after running it against the installed application and recording its result.
