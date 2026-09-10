# Channel Cast module parity

Pinned source: `Qallus/Channel-Cast-OS` at `8cd1de0a6c3aacd2da08b0544a29e9df5a6044cf`. Full checkout inspected through route/dependency inventory; deeper action-by-action migration remains in progress. No source records or credentials imported.

The pre-existing `../channel-cast/FEATURE_PARITY.md` is the detailed implemented/gap inventory. Its omissions remain **required backlog**, not approved scope exclusions. `source-inventory.json` preserves discovered components, imports, API references, table references and UI labels. It is static evidence, not proof of working actions.

| Module / source files | Actual source behavior | LayeredFX destination | Status / gaps |
|---|---|---|---|
| Pipeline: components/crm/pipeline-page.tsx, opportunity-detail.tsx; lib/crm/deals.ts, stage-config.ts, pipeline-guidance.ts | Nine stage identities, views, opportunity details, guidance and business activities | components/operations/pipeline.tsx; lib/operations/engine.mjs, defaults.mjs; /admin/pipeline and /stages | In progress. Existing tests cover transition gates/history/lead identity. Provider integrations and canonical CTRL+P customer/order/project linkage not migrated. |
| Workspace: app/app/admin/workspace/page.tsx; components/workspace/plate-editor.tsx; lib/workspace/types.ts | Rich Plate content, folders/spaces, personal/shared docs, archive/delete fields, threaded comments and mentions | components/operations/workspace.tsx, document-editor.tsx; /admin/workspace | In progress. Existing reduced editor, versions and access rules retained. Media, full toolbar/embeds, mentions/replies, trash/template administration and business-record pickers remain. |
| Plans: components/plans/plans-index-client.tsx, plan-workspace.tsx, views/*, tasks/task-detail-drawer.tsx, create-plan/*; lib/plans/types.ts, access.ts | Four views, templates, tasks, groups, labels, roles, visibility, archive and capability settings | components/operations/plans.tsx; /admin/plans | In progress. Existing common task set/permissions retained. Reusable templates, customization and complete source lifecycle remain. Must link to real CTRL+P Projects rather than replacing Projects. |

## Shared dependencies and deliberate safety repairs

Source APIs and backing table/store references are enumerated in `source-inventory.json`. Source `lib/plans/access.ts` permits an administrator to edit archived plans; LayeredFX's stricter archived read-only behavior remains, as explicitly required. Source collaboration concepts do not establish CRDT/cursor synchronization; no real-time coediting claim is made.

Service labels and templates use LayeredFX services. Stable stage identifiers remain new_working, contacted, qualified, opportunity, proposal, negotiation, closed_won, closed_lost, nurture. Manual log entries remain distinguishable from source email/SMS/voice/calendar/payment execution.

## Verification boundary

See `../reviews/current-review.md` for actual dependency-backed checks and browser results. Live authentication, RLS, durable multi-user persistence, external integrations and the full combined workflow require authorized LayeredFX-only staging. No feature in this table is marked complete.
