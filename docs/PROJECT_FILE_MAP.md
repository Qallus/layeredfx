> Current increment: Pipeline, Workspace and Plans source is now included. Start with `START_HERE.md` and `docs/channel-cast/`. The material below remains the earlier homepage map / broader roadmap, not an instruction to rebuild or discard the current dashboard.

# Project file placement

All paths below are relative to the **LayeredFX project root**, the folder containing `package.json`.

| Location | Contents / responsibility |
|---|---|
| `app/page.tsx` | Homepage route at `/`. |
| `app/layout.tsx` | Root HTML layout, metadata, global and LayeredFX CSS imports. |
| `app/globals.css` | Tailwind entry and base stylesheet. |
| `app/icon.svg` | Proposed LayeredFX favicon. |
| `app/robots.ts` | Prototype indexing configuration. |
| `app/api/health/route.ts` | Deployment health endpoint. |
| `components/layeredfx/` | Homepage sections and interactions. |
| `components/layeredfx/ui/` | Included editable shadcn-style, Radix-backed primitives. Keep these namespaced. |
| `components/layeredfx/layeredfx.css` | Brand variables, responsive layout, CSS transitions and fallback material scene. |
| `lib/layeredfx/content.ts` | Service, material, inspiration and FAQ content. |
| `lib/layeredfx/material-scene.ts` | Browser-mounted Three.js renderer and animation. |
| `lib/layeredfx/validation.mjs` | Shared input-validation functions. |
| `lib/layeredfx/validation.d.mts` | Type declarations for the validators. |
| `lib/layeredfx/utils.ts` | Class-name utility used by UI components. |
| `public/images/` | Website illustrations and social assets; referenced by `/images/...`. |
| `preview/index.html` | Interactive standalone HTML companion; not the production entry point. |
| `preview/*.png` | Desktop, full-page, mobile and material-studio review screenshots. |
| `preview/interactions.js` | Standalone-preview interaction source, retained for reference. |
| `preview/material-scene.js` | Standalone-preview scene source, retained for reference. |
| `tests/validation.test.mjs` | Six dependency-free validator tests. |
| `prompts/01-CLAUDE-START.md` | Copy/paste kickoff for setup or an existing-project merge. |
| `prompts/02-CODEX-REVIEW.md` | Copy/paste phase-review assignment. |
| `docs/LAYEREDFX_BUILD_MASTER.md` | Consolidated roadmap for the rest of the LayeredFX build. |
| `docs/CONTROL_P_INTEGRATION.md` | Safe integration with a separate copy of ControlP. |
| `docs/DEPLOY_COOLIFY.md` | Deployment configuration and launch boundaries. |
| `docs/DESIGN_SYSTEM.md` | Design specification. |
| `docs/ASSETS_AND_CONTENT.md` | Asset and content notes. |
| `docs/NEXT_PHASE.md` | Implementation work remaining after the homepage. |
| `docs/QA_REPORT.md`, `docs/QA_RESULTS.json` | Original prototype verification evidence and limits. |
| `docs/PACKAGING_REPORT.md` | This consolidation's path, file-preservation and test checks. |
| `docs/SOURCES.md` | Original development references. |
| `CLAUDE.md`, `AGENTS.md` | Root-level instructions for coding agents. |
| `START_HERE.md`, `README.md` | Setup and project overview. |
| `THIRD_PARTY_NOTICES.md` | Retained attribution / dependency notices. |
| `package.json` | Dependency manifest and npm scripts. |
| `next.config.ts`, `next-env.d.ts`, `tsconfig.json` | Framework / TypeScript configuration. |
| `tailwind.config.ts`, `postcss.config.js`, `components.json` | Styling and component configuration. |
| `eslint.config.mjs` | Lint configuration. |
| `Dockerfile`, `.dockerignore` | Container build configuration. |
| `.env.example`, `.gitignore` | Environment template and Git exclusions. |
| `PROJECT_STRUCTURE.txt` | Full directory and file listing. |
| `FILE_MANIFEST.sha256` | Checksums of every other delivered file. |

## Existing populated project

This folder layout is directly usable in an empty LayeredFX project. The local project was not supplied, so no automatic merge into its actual files is claimed.

If the target already contains code, do not replace its package manifest, lockfile, routing, globals, or layouts indiscriminately. Read `CONTROL_P_INTEGRATION.md`; it explains duplicate-header/footer prevention, image collisions, dependency merging, and the `/` route collision between `app/page.tsx` and `app/(site)/page.tsx`.

Do not copy `preview/index.html` to `app/page.tsx`, and do not place the React components in `public/`. Do not create a second nested project. The source imports use `@/` mapped to the root in the supplied `tsconfig.json`.

## No duplicate attachments required

The separately delivered HTML is already at `preview/index.html`. The four separately delivered screenshots are already in `preview/`. They are byte-identical to the conversation attachments. Do not add additional copies at the root.
