> Authoritative scope correction: preserve the LayeredFX public website and migrate the COMPLETE CTRL+P dashboard, adding Channel Cast Pipeline, Workspace and Plans. Earlier selective-reuse, exclusion and lightweight-dashboard directions are superseded. Unrelated development and safety instructions remain. See docs/migration/SCOPE.md and docs/reviews/current-review.md.

# Channel Cast → LayeredFX: implementation and limits

This is a **source-reviewed adaptation**, not a byte-for-byte copy or a complete migration of Channel Cast OS. The existing LayeredFX homepage remains. No Channel Cast data, credentials or device/advertising providers were imported.

Contacts and FAB update: `/admin/contacts` and `/admin/leads` now provide canonical contact creation, categories, user links, owners, lead/pipeline assignment, activity, bulk actions, five views and phone/VCF/CSV import with Select all. The shared FAB adds private notes, internal DMs, local microphone recording and configurable outgoing Twilio SMS/Voice, plus access to the existing AI Agents page. See [Contacts and FAB](../migration/CONTACTS_AND_FAB.md) for exact implemented behavior and limitations; incoming communications, AI execution and physical Android/live-provider verification remain incomplete.

## Pipeline

| Source concept | LayeredFX implementation |
|---|---|
| Nine source stages | All stable IDs retained: new_working, contacted, qualified, opportunity, proposal, negotiation, closed_won, closed_lost, nurture. |
| Stage path and board | Detail path plus Board, List, Table, Cards and Calendar. Moves all invoke the same validated command. |
| Display labels / probability | Configurable labels and default probabilities; fixed won/lost endpoints of 100/0. Starting probability respects configuration. |
| Stage guidance | Editable goal, suggested actions and required/optional checklist items. Source automatic predicates stay tied to stable item IDs. |
| Advance rules | Required items block forward moves, including skipped intermediate stages and advancement from nurture. Administrator exception requires a recorded reason. |
| Opportunity-only steps | Add required/optional steps without modifying every opportunity. The command layer also supports removing extra steps. |
| Next action | Action, due date, assigned member, type and priority; overdue/missing warning uses America/Phoenix day boundaries. It is a task reminder record, NOT a calendar booking. |
| Stalled opportunity | Reason, since timestamp, notes, follow-up date and clear action. |
| Owner and stage history | Append-only entries across reassignment, stage changes, outcomes and reopen. Owner must be active and able to work records. |
| Outcome handling | Lost reason/notes/competitor; won value and summary; nurture revisit; explicit reopen reason. Soft archive preserves history. |
| Lead conversion | Manual lead inbox and intentional conversion with stable lead/contact/opportunity relationship. Repeat conversion does not duplicate the opportunity. |
| Contacts and clients | Contact linkage and email deduplication; won updates the contact relationship to client. Separate full contact/account management screens are not included. |
| Won handoff | Creates one linked planning handoff record per opportunity. A linked installation Plan can be created/opened explicitly. This is not a full project/finance ERP. |
| Custom fields | Text/number/date values, validation, add/remove interface; update is supported through the shared command. |
| Activity timeline | Manual notes, call, email, SMS, voice, AI-voice, appointment, task, invoice, payment and contract log categories, plus system stage/checklist/ownership events. |
| Linked records | Opportunity-linked Workspace documents and Plans with access filtering and direct navigation. |
| Reports | Open value/count, weighted forecast, won value and decided win rate. Nurture and archived records excluded from open forecast. Filtered export. |

**Not yet migrated; required scope remains:** live dialer, email/SMS delivery, AI agent execution, recordings/transcripts, external booking creation, invoice/payment processing, e-signatures, advertiser/venue/partner conversion, automated notifications, arbitrary creation/reordering of stage IDs, or a full contact/account CRM. Logs describe manual events; they never execute these services. The stable stage-ID set is deliberate, matching the reviewed source model.

Stage moves change the same opportunity; they do not create separate “prospect,” “client” or “lead” copies. A plan is an execution record, not another sales stage. Reopening a won opportunity retains its handoff and records the new sales history; it does not delete ongoing delivery work.

## Workspace

| Source concept | LayeredFX implementation |
|---|---|
| Multiple workspaces / folders | Workspace selection, creation and nested-folder creation; personal/shared folder visibility. Move documents between permitted folders in the same workspace. |
| Documents / search | Title, Plate-compatible content_json, derived plain text, content/title search, personal/shared/favorite/archived filters. |
| Rich-text editor | Actual Plate editor dependency with paragraph/headings, basic marks, blockquote, rule rendering, lists, safe links and table insertion. Not a plain textarea mock. |
| Templates | LayeredFX consultation, scope, team meeting and handoff templates. |
| Ownership / sharing | Personal/shared visibility; editor/viewer collaborators. Team-shared documents editable by staff unless explicitly viewer. Admin can manage all organization records. |
| Saved versions | Explicit save creates prior snapshots; restore creates another version. Last 40 prior snapshots retained. |
| Comments | Document discussion, optional quoted text at command level, author/owner resolution and reopening. |
| Favorites / archive / export | Per-person favorite toggle, soft archive/restore and JSON export. |
| Cross-module context | Opportunity-linked briefs with return navigation. |

**Not yet migrated; required scope remains:** the full Channel Cast editor toolbar, font/color/alignment controls, columns, media upload/recording, HTML sandbox embeds, code-block syntax tools, table-of-contents controls, live-app embeds, inline record/document pickers, mentions, replies/notifications, template favorite/hide administration, folder rename/delete administration, or simultaneous collaborative cursor/CRDT editing. The source files include these additional concepts; this package does not imply they are implemented.

Documents require explicit saving. This is a versioned editor with conflict detection, not real-time multi-user coediting. Moving/sharing a document does not grant access to private linked plans. Unsupported source block types should not be bulk-imported into the reduced editor before an import-compatibility review. No bulk source-data import is included.

## Plans

| Source concept | LayeredFX implementation |
|---|---|
| Plans index | All / mine / shared / archived, search, template creation and progress summaries. |
| Task views | Board, Grid, List and Calendar over the same task records. |
| Groups / labels | Groups add/rename/remove-empty, task grouping, labels and task label assignments. |
| Task detail | Title, description, notes, status, priority, progress, dates, estimated minutes, milestone, assignees, labels and checklist. |
| Assignment | Multiple active assignees; private-plan membership checked before assigning. Read-only users cannot be assigned tasks. |
| Completion | Complete sets progress to 100 and records completion time; reopening clears completion time and adjusts progress below 100. |
| Task movement | Board drag between groups/status, task modal changes, keyboard/touch alternatives and list order control. |
| Permissions | Private/team plan visibility; owner/admin management and editor/member/viewer membership. Archived plans read-only. |
| Templates | Blank, surface transformation, painting and commercial installation. Fresh task/checklist IDs generated on each creation. |
| Links / export | Opportunity-linked plans and JSON export of plan/tasks. Repeated opportunity handoff opens the existing active plan when requested. |

**Not yet migrated; required scope remains:** a subscription/pricing module (Plans never means pricing here), premium entitlements/billing, user-created reusable template library, plan cover/icon customization, full custom ordering UX, owner transfer, dependencies/Gantt, recurrence, resource capacity scheduling, or automatic calendar synchronization. `plan_type` stays basic; no payment is required to use the implemented views. Label rename/delete is not implemented in this increment.

## Persistence and access

Local development stores a schema-versioned snapshot in the browser. Production requires a separate LayeredFX Supabase project and verified active team membership. The server uses the same engine as the demo, filters private records before responding, and performs an organization/revision compare-and-swap update. It does not accept arbitrary replacement state.

The initial server store is bounded JSONB per organization, not a high-volume normalized CRM. It has an 8,000,000-byte state limit and 350,000-byte document-content limit. There are no remote file uploads in these modules. For larger teams, move records into normalized tables and narrower transactions without weakening the command/auth boundaries.

Production setup, backups, abuse protections and integration tests remain mandatory. See SETUP.md and QA_REPORT.md.
# Customer and partner portal increment

LayeredFX now includes separate customer and partner portal routes with frontend login/registration and staff partner approval. Exact implemented behavior and remaining integration gaps are in `../migration/PORTALS.md`. This is not full CTRL+P customer/partner portal parity. Live Supabase activation and staging verification remain outstanding; the SQL is a review draft only.

## Frontend contact and booking entry

Public `/contact` and `/book` now share the themed frontend navigation with the homepage and Login/Register. Public forms prepare drafts for explicit submission through the authenticated customer portal (browser-only in local preview). Booking is a consultation request with preferred date/time; it does not reserve available slots. See `docs/reviews/current-review.md` for verification and remaining scheduling work.
