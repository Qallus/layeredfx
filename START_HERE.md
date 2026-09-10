# LayeredFX — Homepage + Pipeline + Workspace + Plans

This is the merged project-root package. It includes the prior homepage, shadcn/ui source, Three.js material studio, artwork and previews, plus source-reviewed adaptations of three Channel Cast modules. It is not the complete Channel Cast or ControlP application.

## Open the project

Extract the ZIP. Copy its **contents** into your LayeredFX project root, or open the extracted folder containing `package.json` in VS Code. Include dotfiles. Do not put the whole package inside `app/`, `src/`, or `public/`.

If you already changed your local project, make a Git checkpoint or backup first. Merge the changed root files listed in `docs/channel-cast/MERGE_MAP.md`; do not blindly overwrite your own layouts, dependency files or routes. Do not delete `.git`, copy credentials from other businesses, or modify those apps' deployments.

Use Node.js 22 or newer:

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000` — existing public homepage.
- `http://localhost:3000/admin` — new operations dashboard.
- `/admin/pipeline` — opportunities, lead inbox and five views.
- `/admin/pipeline/stages` — stage rules and guidance (administrator-only).
- `/admin/workspace` — documents, folders and templates.
- `/admin/plans` — installation/task plans.

**Development defaults to a synthetic browser-only demonstration.** No login or keys are required in this mode. Changes persist in this browser's local storage; they are not shared with other devices. Use fictional test details. The banner always identifies this mode. The key is `layeredfx:operations:v2`.

## Production is different

Production does not permit anonymous demo access to the dashboard. It requires a separate LayeredFX Supabase project, auth users, active team membership, the included SQL migration, and the `LFX_` environment settings. The public homepage still works when operations is unconfigured.

An authenticated Next.js API adapter and SQL schema are included. They have **not been exercised against a live Supabase instance**. Review `docs/channel-cast/SETUP.md` and complete its staging checks before using real records.

## Agent handoff

Read root `CLAUDE.md` / `AGENTS.md`. Paste `prompts/03-CHANNEL-CAST-INTEGRATION.md` into Claude Code. The current task is to validate and complete this merged implementation, not regenerate the homepage or rebuild a new app from scratch.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` is dependency-free and has passed here. Full dependency-backed typechecking, lint, Next.js build, actual Plate/Radix/Three.js rendering and authenticated database/browser tests remain local validation tasks. Package installation was unavailable in the delivery environment; no successful build or fabricated lockfile is claimed. Install locally, review and commit the generated `package-lock.json`, then use `npm ci` on clean builds.

## Feature boundaries

Pipeline includes all nine source stage identities, stage requirements/guidance, overrides with history, next actions, lost/won/nurture/reopen, ownership, custom fields, lead conversion and linked records. Workspace and Plans are **adaptations**, not complete copies of every source feature. Read `docs/channel-cast/FEATURE_PARITY.md` for exact limits.

The homepage estimate is still preview-only. Manual activity logs do not send email/SMS, call anyone, execute AI, create signed contracts, take payments or book an external calendar. A won opportunity creates a linked handoff record, not a complete accounting or installation ERP.

The existing `preview/index.html` and PNG files still show the public homepage only. Preview the new dashboard using `npm run dev`; there is no pretend static dashboard substituted for its React implementation.

No remote repository, live database, VPS, DNS or other company application was changed by this delivery.
