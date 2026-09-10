# Copy / merge map

The full ZIP includes the earlier LayeredFX homepage package plus this increment, with paths rooted directly at your project folder. No wrapper directory. No original source file was deleted. No `.git`, secrets, dependency install or generated build output is bundled.

Make a Git checkpoint before copying over a project with your own edits. The full ZIP is based on the last `LayeredFX-Project-Ready.zip` supplied in this conversation, not unseen changes in your local VS Code folder.

## Critical merges

- `package.json`: adds Plate editor packages and server-only. Keep the destination's existing dependencies; install locally and regenerate the actual lockfile.
- `.env.example`: adds isolated `LFX_` configuration. Never replace `.env.local` or copy other businesses' keys.
- `components/layeredfx/home-page.tsx`: adds only a footer Team dashboard link to the existing homepage.
- `app/robots.ts`: adds `/admin/` to the live indexing exclusions.
- `app/admin/` and `app/api/operations/`: new routes. If you already have an admin layout/auth system, merge its session and shell carefully rather than nesting two dashboards. Maintain equivalent server authentication on every operations command.
- `lib/operations/server.ts`: uses a separate membership/store model; do not point it at source-business credentials.
- `supabase/migrations/`: review; do not auto-run on an unknown connection.
- Documentation and root agent instructions supersede the earlier homepage-only handoff.

For a destination already using `src/app`, move these routes/helpers consistently and preserve its alias mapping. For a ControlP-derived destination using `app/(site)/page.tsx`, do not introduce a second route serving `/`; integrate the unchanged LayeredFX homepage into the existing single marketing route.

## New files

- `CHANGELOG.md`
- `app/admin/(operations)/layout.tsx`
- `app/admin/(operations)/page.tsx`
- `app/admin/(operations)/pipeline/[id]/page.tsx`
- `app/admin/(operations)/pipeline/page.tsx`
- `app/admin/(operations)/pipeline/stages/page.tsx`
- `app/admin/(operations)/plans/[id]/page.tsx`
- `app/admin/(operations)/plans/page.tsx`
- `app/admin/(operations)/workspace/[id]/page.tsx`
- `app/admin/(operations)/workspace/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/login/page.tsx`
- `app/api/operations/auth/login/route.ts`
- `app/api/operations/auth/logout/route.ts`
- `app/api/operations/auth/refresh/route.ts`
- `app/api/operations/route.ts`
- `components/operations/document-editor.tsx`
- `components/operations/login.tsx`
- `components/operations/operations.css`
- `components/operations/pipeline.tsx`
- `components/operations/plans.tsx`
- `components/operations/provider.tsx`
- `components/operations/shared.tsx`
- `components/operations/shell.tsx`
- `components/operations/workspace.tsx`
- `docs/channel-cast/FEATURE_PARITY.md`
- `docs/channel-cast/MERGE_MAP.md`
- `docs/channel-cast/QA_REPORT.md`
- `docs/channel-cast/QA_RESULTS.json`
- `docs/channel-cast/SETUP.md`
- `docs/channel-cast/SOURCE_MAP.md`
- `lib/operations/defaults.d.mts`
- `lib/operations/defaults.mjs`
- `lib/operations/engine.d.mts`
- `lib/operations/engine.mjs`
- `lib/operations/security.d.mts`
- `lib/operations/security.mjs`
- `lib/operations/server.ts`
- `lib/operations/types.ts`
- `prompts/03-CHANNEL-CAST-INTEGRATION.md`
- `prompts/04-CODEX-OPERATIONS-REVIEW.md`
- `supabase/bootstrap-example.sql`
- `supabase/migrations/20260910_layeredfx_operations.sql`
- `tests/operations-engine.test.mjs`
- `tests/operations-security.test.mjs`

## Changed existing files

- `.env.example`
- `AGENTS.md`
- `CLAUDE.md`
- `FILE_MANIFEST.sha256`
- `PROJECT_STRUCTURE.txt`
- `README.md`
- `START_HERE.md`
- `THIRD_PARTY_NOTICES.md`
- `app/robots.ts`
- `components/layeredfx/home-page.tsx`
- `docs/DEPLOY_COOLIFY.md`
- `docs/LAYEREDFX_BUILD_MASTER.md`
- `docs/NEXT_PHASE.md`
- `docs/PACKAGING_REPORT.md`
- `docs/PROJECT_FILE_MAP.md`
- `docs/QA_REPORT.md`
- `package.json`
- `prompts/01-CLAUDE-START.md`
- `prompts/02-CODEX-REVIEW.md`

## Data migration

No users, secrets or business records were migrated. Local demo storage uses a new LayeredFX-specific key. Production starts with an empty LayeredFX store after authorized setup; it does not import Channel Cast's CRM collections or ControlP's customers.
