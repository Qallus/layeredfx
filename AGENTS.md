# LayeredFX — Codex / agent review rules

Read `CLAUDE.md`, `START_HERE.md` and `docs/channel-cast/` before editing. Review and fix this merged implementation; do not recreate the homepage or downgrade the request to a new mockup.

## Validate before approval

Run npm install, npm test, npm run typecheck, npm run lint, npm run build. Record exact output. Review original homepage as well as the new modules. Do not equate the dependency-free reducer tests or parser checks with a passing React/Next.js build.

Review these paths first:
- Pipeline board/detail/stage settings: a direct API command, drag, picker, skip, or nurture cycle must not bypass required rules. Admin overrides require recorded reasons. Won/lost/reopen preserve history.
- Lead conversion: same lead/contact/opportunity identities across repeats; owner cannot be a read-only member.
- Workspace: private/shared permissions, viewer/editor roles, folder boundaries, version restoration, safe content JSON and links, unsaved edits, same-document update conflicts.
- Plans: private/team/member permissions, all four views sharing one task set, groups, dates, completion state, labels, checklists, archived read-only behavior and relation integrity.
- API: verified Supabase user + active LayeredFX membership on every request; origin enforcement, bounded bodies, optimistic revision conflict, filtered responses, no secret exposure.
- Production: no demo bypass; isolated LayeredFX variables; RLS-denied direct browser data access; actual service-role flow verified on staging only after authorization.

Use a separate worktree for review fixes. Keep history and unrelated local edits. No remote push, live migration, DNS or Coolify changes unless requested. Keep functionality claims aligned with `FEATURE_PARITY.md`.

Write findings to `docs/reviews/current-review.md`: severity, file, evidence, fix, verification and remaining blockers. Use `prompts/04-CODEX-OPERATIONS-REVIEW.md` for the acceptance test outline.
