# Reviewed Channel Cast source

Repository: https://github.com/Qallus/Channel-Cast-OS.git
Branch inspected: `main`
Review date: 2026-09-10

The source was read through the connected GitHub repository. No source repository was modified. The following are verified file blob hashes, not a claim that an entire repository commit was cloned. Some large UI files were reviewed by selected ranges; the adapter is therefore described as source-reviewed, not a complete upstream reproduction.

| Source path | Verified blob SHA | LayeredFX destination / use |
|---|---|---|
| `package.json` | `51987901064d624ef4d688ddd8ddee3e63f69d7d` | Relevant Plate dependencies only; existing LayeredFX stack preserved. |
| `components/crm/pipeline-page.tsx` | `a82804c40780e8e6749e4514bdb9bac05f44fe22` | `components/operations/pipeline.tsx`; five views and opportunity lifecycle. |
| `components/crm/opportunity-detail.tsx` | `3e9514b2f3441bfe3e840e50a3e4c90cd3e552eb` | Opportunity detail, stage path, activity/linked-record structure. |
| `lib/crm/deals.ts` | `7dde9348627c198068cef5e407a7430994246dc4` | `lib/operations/types.ts`, `defaults.mjs`, `engine.mjs`; stage IDs/history/next step/outcomes. |
| `lib/crm/stage-config.ts` | `b3e27dbe16c31df36f0af1f76338ee9137c48de3` | Editable guidance and required automatic/manual steps. |
| `lib/crm/pipeline-guidance.ts` | `dcc570888cd6cbc5684848f37e1d22fb7383ca21` | LayeredFX-specific stage goals and completion requirements. |
| `app/app/admin/workspace/page.tsx` | `c2a5f3efe994de518dfc2e4d7c62be793f7f7312` | Workspace ownership/folders/template selection. |
| `lib/workspace/types.ts` | `fb1c5b9aab8e84e0e6e0129c95d06c6ceef27505` | Portable Plate JSON, document scope and comment concepts. |
| `components/workspace/plate-editor.tsx` | `18746d6fc4ff73aee7d146ec9ffdc40e7c977f13` | Reduced portable editor in `components/operations/document-editor.tsx`. |
| `app/app/admin/plans/page.tsx` | `7e5da89879871ffde42222ba42a24098ee5ebe5b` | Plans are execution/task planning, not subscription tiers. |
| `components/plans/plans-index-client.tsx` | `b3d0d48b97c69c26dde3fca89791056d91cd5c66` | Plan index, ownership filters and template entry. |
| `lib/plans/types.ts` | `b3b154fd3862f2aeba11bfb1d7b300c1cb2e4e64` | Plans/tasks/groups/members/checklists and four views. |
| `lib/plans/access.ts` | `d67e1cdedcf6546b978d5c968997a340b8f7c2e9` | Record authorization concept, rewritten for isolated LayeredFX roles. |

## Deliberate adaptations

The source depends on Channel Cast's layout, JSONB stores, membership model and many provider endpoints. Blind-copying its route components would leave unresolved imports or connect the wrong business systems. This package provides a dedicated LayeredFX dashboard shell, namespace, command engine, local adapter and server-authenticated storage boundary instead.

The website/homepage UI primitives stay namespaced in `components/layeredfx/ui`. New business UI lives in `components/operations`. Source `/app/admin/...` navigation becomes LayeredFX `/admin/...`. No original routes, schemas or credentials are assumed to exist in the receiving project.

Stages use the source's stable IDs; service language is adapted to wraps, film, finishes and paint. Lost is an outcome and nurture is parked, not intermediate production steps. A completed sale links out to execution Plans rather than overwriting its sales history.

Stage rules are enforced at one shared mutation boundary in both UI modes. The adapter adds server-side access filtering, explicit origin/body checks, optimistic revision protection and isolated `LFX_` configuration; these are not represented as a verbatim copy of the source security implementation.

See `FEATURE_PARITY.md` for implemented concepts and source features not carried over.

## Primary implementation references

- https://nextjs.org/docs/app/guides/authentication
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://platejs.org/docs/editor

Verify dependency APIs and current security advisories during local installation; no dependency-backed build was completed in the delivery environment.
