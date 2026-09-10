> Authoritative scope correction: preserve the LayeredFX public website and migrate the COMPLETE CTRL+P dashboard, adding Channel Cast Pipeline, Workspace and Plans. Earlier selective-reuse, exclusion and lightweight-dashboard directions are superseded. Unrelated development and safety instructions remain. See docs/migration/SCOPE.md and docs/reviews/current-review.md.

# LayeredFX — Claude Code instructions

Read in order:
1. `START_HERE.md`
2. `docs/channel-cast/FEATURE_PARITY.md`
3. `docs/channel-cast/SOURCE_MAP.md`
4. `docs/channel-cast/MERGE_MAP.md`
5. `docs/channel-cast/SETUP.md`
6. `docs/channel-cast/QA_REPORT.md`
7. `docs/DESIGN_SYSTEM.md`

This package already includes the homepage and working domain implementations for Pipeline, Workspace and Plans. Validate and complete the supplied code rather than regenerating it. Earlier homepage-only reports are historical; the current source and `docs/channel-cast` reports describe this increment.

## Immediate task

Inspect Git status and the destination app before merging. Preserve local edits and a single `/` route. Install dependencies, generate the real lockfile, run typecheck, lint, tests and build, and fix concrete issues. Verify real React/Radix/Plate and Three.js behavior in a browser. The delivery environment did not complete dependency installation or a production build.

Use `prompts/03-CHANNEL-CAST-INTEGRATION.md` for detailed acceptance checks. Keep Claude and Codex on separate worktrees or one active file owner; do not run both rewriting the same files.

## Non-negotiable boundaries

- Do not push to or change Channel Cast / ControlP or their deployment/database.
- Use a separate LayeredFX auth/data/storage environment; never copy their secrets, users or records.
- Never weaken `mode()` to allow unauthenticated demos in production.
- Preserve server-side membership checks and record access filtering. UI hiding is not authorization.
- Every stage mutation goes through `applyCommand`; no direct stage PATCH, board bypass or silent admin override.
- Retain closed/lost history, owner assignment and lead identity. Repeated conversion must not duplicate contacts/projects/plans.
- Never expose the service key through client code, logs, public envs or JSON responses.
- Preserve compare-and-swap revision checks. Do not silently retry a stale whole-state overwrite.
- Report failed operations; never fall back from live database failure to demo data.
- Preserve the homepage, its shadcn/ui primitives, real Three.js lazy rendering, accessibility and reduced-motion behavior.
- Do not claim email, SMS, AI, invoice payment or external booking integrations exist because manual timeline logs exist.
- Do not claim simultaneous collaborative editing, advanced Workspace embeds or the full source app were ported.
- No fake testimonials, business claims, addresses, licenses, installed finishes or completed-project photos.
- Do not deploy or execute live SQL without explicit authorization and confirmed LayeredFX target.

## Later work

Use `docs/channel-cast/FEATURE_PARITY.md` as the backlog for required source features not yet migrated. The earlier `docs/LAYEREDFX_BUILD_MASTER.md` remains the broader product roadmap, not an instruction to discard the new dashboard. Update the parity/QA reports with measured results, not assumptions.
