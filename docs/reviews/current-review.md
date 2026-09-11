# Booking button and scheduling review - 2026-09-10

LOW - `ctrlp/components/admin/admin-bookings.tsx` and `components/admin/dashboard.css`: Public booking page used the generic primary button palette. Added a scoped button style matching the sidebar background (#202b28) and text (#c2cdc5), with navigation hover colors and a keyboard focus outline. Browser computed colors match the sidebar in both light and dark modes; exact evidence: `logs/booking-button-browser.json`.

MEDIUM / remaining blocker - The existing button points to `/book`, which has no route. Customer `/portal/bookings` supports appointment requests, not reserved time slots. CTRL+P source commit 015a7b58b80e63ef87c73bec549a23242b88f3e3 was reviewed: its public page loads appointment types, loads availability for a date/type, collects customer details and submits an appointment before confirmation. Its dashboard manages types, availability rules, blocked time and appointments. LayeredFX's imported booking management API still returns an integration-unavailable response; that complete scheduling flow is not yet connected. This styling change does not claim to implement it.

Supabase connection: user supplied project URL tdywcdgbavfcsywejoka.supabase.co and reported MCP authorization. No Supabase tools are exposed in this session, so project identity/schema/configuration could not be verified. No live schema, Auth or Storage changes were made. Portal SQL remains an unapplied review draft.

Validation: required install output in `logs/booking-button-install.txt`; tests/typecheck/lint/build output in shared `*-verified.txt` logs and `verification.json`.

---

# LayeredFX integration review — Jobs search spacing, 2026-09-10

LOW — `cmi/app/dashboard/jobs/jobs-list-client.tsx`: dashboard input padding overrode the utility padding reserved for the search icon, causing placeholder overlap. Added a scoped `.ops input.ops-jobs-search` rule with 40px left padding, an accessible input label, and a decorative icon that ignores pointer events. This preserves the existing search handler and theme colors. Verification output is recorded in `logs/jobs-search-browser.json`, `logs/jobs-search-install.txt` and the shared `*-verified.txt` logs; screenshots cover desktop and mobile in both themes. No backend behavior changed.

## Previous customer and partner portal checkpoint

New public login/registration and separate customer/partner workspaces are implemented. See `docs/migration/PORTALS.md` for routes, exact functionality, data model, setup and exclusions. Partner accounts require staff approval, per the owner's explicit choice.

| Severity | File / evidence | Fix | Verification / remaining blockers |
|---|---|---|---|
| HIGH | Public registration must not create operations membership or let users approve themselves | Separate portal cookies/account table; verified Supabase email and server-owned account status; admin-only approval endpoint | Domain/API isolation tests pass; live email/auth/membership flow requires isolated staging |
| HIGH | Account media must not be publicly enumerable | Private bucket; owner-scoped server paths; checked media signatures and 20 MB bounded streaming; 60-second signed URLs; active staff checks for team viewing | Source review and preview upload test; live Storage/RLS verification still blocked by missing configuration and unapplied draft |
| MEDIUM | Account changes could overwrite concurrent edits | Account revision comparison and database conditional update | Mocked API stale revision returns 409; real concurrent staging checks pending |
| LOW | No frontend login/registration or customer/partner workspaces | Split branded auth pages, homepage links, portal requests/catalog/notes/media/messages/profile, partner referrals/vendor submissions and staff review page | Desktop/mobile Edge preview persistence checks pass |
| LOW | Browser-restored profile form showed initial values | Remount profile form by account revision | Saved profile survives reload in browser test |

Validation: npm install passed (504 packages, zero vulnerabilities); all 144 tests, typecheck, lint and production build pass. Lint has 219 warnings, no errors. Exact output: `logs/portal-install.txt`, `logs/*-verified.txt`. Portal browser checks: `logs/portal-browser.json`, `screenshots/portal-*.png`. Production and homepage smoke results are recorded in their shared logs. SQL remains a review draft; no Supabase migration, live auth registration, email, Storage call, DNS or Coolify deployment was performed.

Remaining activation blockers: isolated LayeredFX Supabase configuration, approved draft migration and private bucket policy review, SMTP/email confirmation, live two-account isolation/approval/refresh/upload checks, gateway abuse controls. Requests do not yet synchronize source booking/order/payment/install calendars; account-to-team messaging requires reload. Source portal parity, OAuth, password recovery, shared business subusers, media deletion and retention are not claimed.

## Previous branded fields checkpoint

| Severity | File / evidence | Fix | Verification / remaining blockers |
|---|---|---|---|
| LOW | Pipeline `.ops-toolbar` distributed filters across the entire page | Dedicated wrapping filter row with 12px gaps, bounded search and 180px selects | Desktop/mobile screenshots, filter selection and overflow checks passed |
| LOW | Operations used native select menus and date controls | Shared Radix select and branded calendar/time dialog; wired Contacts, Pipeline, Plans, Workspace, FAB and CTRL+P shared Input; retained CMI's existing custom controls | Custom dropdown selection, calendar date selection, invalid-date rejection and module rendering passed |
| LOW | Inputs/dialogs lacked consistent dark styling | Shared field surfaces, borders, focus styling, custom checkbox appearance and dark portal colors | Dark dropdown color measured and form screenshots reviewed |
| LOW | FAB used plus icon and bright background | Sparkles icon, requested #202b28 background / #d6ff41 foreground; existing sizing and mobile offsets retained | Browser style/icon assertions passed |

Validation: dependency installation passed with zero vulnerabilities (`logs/fields-install.txt`). All 131 tests, typecheck, lint and production build passed; lint retains existing warnings. Exact logs in `logs/*-verified.txt`. `scripts/fields-browser.mjs` and Contacts/FAB regression passed, including identity linking, phone Select all import, direct messages and local recording (`logs/fields-browser.json`, Contacts browser logs). No live provider actions or database changes. Custom date/time text entry uses ISO values and validates dates/times and min/max bounds. Device-owned camera/file chooser dialogs remain controlled by the operating system.

## Previous width and logo checkpoint

| Severity | File / evidence | Fix | Verification / remaining blockers |
|---|---|---|---|
| LOW | `components/admin/dashboard.css`: `.lfx img` overrode the less-specific icon hide rule, showing both sidebar images | Scope the default hidden app icon to `.ops .ops-brand-icon`; preserve collapsed-state override | Exactly one visible brand image verified expanded, collapsed and mobile |
| LOW | `components/operations/shell.tsx`: redundant top-bar logo | Remove top-bar image and divider; left-align Operations alongside the toggle | No top-bar images in browser checks |
| LOW | `.ops-main` inherited a 1750px centered width cap | Full available width with 28px desktop gutters, 16px mobile gutters | Customers, Messages and Dashboard verified at 3808px wide, expanded and collapsed; mobile overflow check passed |

Validation: npm install, all 131 tests, typecheck, lint and production build passed (existing lint warnings remain). Exact output: `logs/layout-install.txt`, `logs/*-verified.txt`. Browser evidence: `logs/layout-browser.json`, `screenshots/layout-*.png`. Homepage logo remains visible. Previous backend/provider limitations below are unchanged.

## Previous mobile menu checkpoint

| Severity | File / evidence | Fix | Verification / remaining blockers |
|---|---|---|---|
| LOW | `components/operations/shell.tsx`: no mobile/tablet shortcut dock | New `mobile-bottom-nav.tsx` with ten requested shortcuts, horizontal scrolling, persistent hide/restore, active links, leads modal, local vCard editor/sharing and native photo/video capture inputs | Phone/tablet/desktop browser checks passed; real phone camera and OS share-sheet checks remain |
| LOW | Existing FAB could overlap a bottom dock | Safe-area-aware offsets in `components/admin/dashboard.css`; modal shortcuts close the quick panel without unmounting call/recorder tools | Call/SMS/record panel geometry checks passed |
| LOW | Local Next development badge covered bottom-left controls | Disable `devIndicators` in `next.config.ts`; center the restore handle | Real pointer navigation and restore checks passed |

Validation: `npm install` exited 0 (504 packages, zero vulnerabilities; `logs/mobile-menu-install.txt`). All 131 tests passed; typecheck, lint and build exited 0. Exact output in `logs/*-verified.txt`; lint retains warnings including the native local-photo preview image. `scripts/mobile-menu-browser.mjs` passed with no page errors; see `logs/mobile-menu-browser.json` and `screenshots/mobile-menu-*.png`. Functionality and limits are recorded in `docs/migration/MOBILE_MENU.md`. Cards are browser-local; public hosted cards and full Channel Cast card-builder parity are not claimed. Existing live backend/provider blockers remain.

## Previous sidebar checkpoint

| Severity | File / evidence | Fix | Verification / remaining blockers |
|---|---|---|---|
| LOW | `components/admin/dashboard.css`: default high-contrast sidebar scrollbar | Thin muted-green scrollbar with transparent track, hover treatment and reserved gutter | Edge computed style and screenshots verified; native scrollbar appearance may vary by OS |
| LOW | `components/operations/shell.tsx`: navigation could not collapse | Accessible top-bar toggle, persisted 76px icon rail, supplied app mark, labeled links with hover titles, full-width mobile drawer | Browser checks passed for navigation, reload persistence, content resizing, keyboard expand, last-link focus, mobile opening/closing and overflow |

Validation: `npm install` exited 0, 504 packages audited, zero vulnerabilities (`logs/sidebar-install.txt`). All 131 tests passed; typecheck, lint (existing warnings) and production build exited 0. Exact output is in `logs/*-verified.txt`. `scripts/sidebar-browser.mjs` passed with no page errors; see `logs/sidebar-browser.json` and `screenshots/sidebar-*.png`. Homepage rendering was checked. Existing backend/provider blockers below are unchanged.

## Previous branding checkpoint

User-supplied artwork now replaces the drawn/text logos on the existing homepage, dashboard sidebar/top bar and sign-in screen. Original assets are preserved in `docs/logos`; runtime copies and usage are documented in `docs/logos/README.md`.

| Severity | File / evidence | Fix | Verification / remaining blockers |
|---|---|---|---|
| LOW | `components/layeredfx/logo.tsx`, `components/operations/shell.tsx`, `components/operations/login.tsx`: generated branding instead of supplied artwork | Use outline frontend and simple dashboard SVGs with correct background contrast and preserved aspect ratio | Edge desktop/mobile screenshots and theme switch passed |
| LOW | `app/icon.svg`: old generated browser icon | Remove conflicting automatic icon; metadata selects supplied light/dark PNGs, manifest uses supplied app SVG | Both media-qualified favicon links, manifest contents and asset HTTP 200 verified |
| INFO | No active email template renderer | Publish both supplied email PNGs and shared absolute URL helper in `lib/brand.ts` | Assets return HTTP 200; live email rendering/delivery remains unconnected |

Validation: `npm install` exited 0 (504 packages audited, zero vulnerabilities; exact output in `logs/brand-install.txt`). `npm test` passed all 131 tests; typecheck, lint and build exited 0 (lint retains existing warnings). Exact command output is in `logs/*-verified.txt` and `logs/verification.json`. Production smoke passed; Edge branding checks passed with no page errors (`logs/brand-browser.json`, `screenshots/brand-*.png`). Existing live-provider and complete-parity blockers below remain unchanged. No live migrations or provider actions were performed.

## Previous checkpoint 3

Contacts and the dashboard-wide Channel Cast FAB are now implemented for review. The source mapping, Android requirements, Select all behavior, Twilio configuration and functional limits are in [Contacts and FAB](../migration/CONTACTS_AND_FAB.md). The previous checkpoints below remain historical; shared verification log paths contain the latest run.

## Contacts/FAB findings and fixes

| Severity | File / evidence | Fix | Verification / remaining blockers |
|---|---|---|---|
| HIGH | lib/operations/engine.mjs previously matched conversions only by email | Added explicit contact IDs on leads, direct contact-to-pipeline conversion, stable repeated conversion and current owner checks. | Unit tests cover repeat conversion, phone-only identity, direct lead creation and preserved pipeline history. Browser creates a contact, links a user and lead, then opens its same-ID opportunity. |
| HIGH | New contact/import/assignment writes | Every write uses the existing authenticated command API, role check and optimistic revision. User links require admin and an existing active member; no auth-user creation or role change. Linked history prevents deletion. | Permission, spoofed-owner, archive, delete and duplicate tests pass. Live Supabase persistence/RLS remains unverified. |
| MEDIUM | Source phone matching discarded country codes and could match only by name | Import review matches email or normalized phone without discarding international prefixes; ambiguous identities are blocked. Imports fill blanks only for explicitly selected matches. | Parser/matching tests cover international collisions, Google CSV, vCard 2.1 and formula-safe CSV export. Physical Android picker still needs device testing. |
| MEDIUM | Large phone selections exceed one command body | Added Select all / Deselect all, byte/count-bounded batches and progress with remaining selection after failure. | Browser mocked the phone picker with 205 contacts, selected all in one click, imported two batches and verified persistence after reload. No phone book was accessed by the test. |
| HIGH | New DMs and notes introduce private data | Filter DMs to participants and notes to their owner before returning state; reject cross-user note writes and stale note revisions. | Unit tests include administrator privacy boundaries and same-timestamp revision conflicts; browser verifies saved notes and preview DM. |
| HIGH | Twilio browser tokens, sends and voice webhook | Server-only isolated configuration; verified membership and write origin; bounded bodies; fixed sender; outgoing-only ten-minute tokens; signature/account/active-member validation on voice webhook. Provider success is reported as accepted/queued, not delivered. | Real SDK signature tests and mocked provider API tests pass. Actual calls/SMS, incoming support and distributed rate limiting are not verified or implemented as described in the feature note. No real calls/SMS sent. |
| MEDIUM | Microphone lifecycle and retained media | Explicit start/stop, track cleanup, 3-minute limit, local IndexedDB storage, playback/download/delete, no upload or automatic call recording. | Browser uses synthetic microphone audio; no real microphone audio was captured. |
| LOW | Phone/Contacts import and existing shell had misdecoded punctuation | Corrected affected UTF-8 source files; scoped contact dialog tokens and fixed empty audio source warnings. | Contacts/FAB browser check has no page or console errors. |

Latest evidence: [Contacts/FAB browser](logs/contacts-browser.json), [tests](logs/test-verified.txt), [TypeScript](logs/typecheck-verified.txt), [lint](logs/lint-verified.txt), [build](logs/build-verified.txt), [command statuses](logs/verification.json), [final install](logs/npm-install-contacts-final.txt), [standalone](logs/production-smoke.json). Staging remains blocked by missing user-provided LayeredFX connections; no migration, deployment or source-company action was performed.

Final measured results: npm install exited 0 (504 packages, 0 vulnerabilities); all **131 tests passed**; typecheck exited 0; lint exited 0 with the existing **218 warnings / 0 errors**; real Next.js build exited 0. Homepage/existing-module browser regression and all 26 dashboard routes passed. Contacts/FAB browser tests had **0 page errors and 0 console errors**, including the 205-contact Select all import. Standalone production gates passed; anonymous Twilio capability/history reads and token/SMS writes returned 401. Exact build-output whitespace is retained in the logs.

## Prior checkpoint 2

**All 19 requested dashboard pages are available for local screen review. Full backend migration remains in progress; this is not production approval.** Preview: `http://127.0.0.1:3000/admin`, from `.review/integration` on `review/full-dashboard`.

Source pins and individual route mappings are recorded in [Dashboard pages](../migration/DASHBOARD_PAGES.md). Added CMI source review at commit `23320abb158e26f0945c2f1ce2f513f02649aa70`. CTRL+P and Channel Cast pins remain those recorded below. The homepage source remains unchanged.

## Current findings and fixes

| Severity | File / evidence | Fix | Verification / remaining blockers |
|---|---|---|---|
| HIGH | Missing requested routes in app/admin/(operations) | Mounted actual CTRL+P clients and CMI Jobs views/form/map in the shared shell; adapted Designers for Installers and the source profile to the current actor. | 26 dashboard routes returned 200 with one shared navigation and no page errors. Source client parity is in progress: handlers, durable records, providers and complete CMI detail routes remain unimplemented. |
| HIGH | Source browser database queries and source-company mock fallback | Namespaced clients; removed mock dashboard fallback; compatibility client never connects to Supabase data. Imported workflow API catch-all verifies membership, origin, viewer restrictions and bounded writes before returning 503. | Four new route tests exercise actual handlers with mocked auth boundary. Standalone anonymous source APIs return 401. Live persistence/RLS not verified. |
| MEDIUM | Workspace card inherited .lfx h2 letter-spacing:-2.4px | Dashboard-only normal tracking, readable title size/line height and body text. Marketing CSS unchanged. | Actual browser computed tracking is normal; desktop screenshot and existing editor save/navigation tests pass. |
| MEDIUM | Source Bookings and Projects expected nonoptional collection keys | Review responses now include empty blocked-time, availability and dependency collections. | Both pages render without runtime errors; this does not validate live response shapes or saved records. |
| MEDIUM | Source dialogs rendered outside shared theme | Mount Radix dialog/sheet/select portals inside the dashboard; scope dialog heading tracking. | Order, Designer and Installer forms open; Order dialog computed tracking normal; screenshot reviewed. |
| HIGH | cmi/app/dashboard/jobs/map/jobs-map-client.tsx interpolated job names and colors into popup HTML | Use DOM textContent for job text, encode the job ID in links, and accept only six-digit hex pin colors. | Typecheck/build verify the adapted Leaflet API; live persisted map records are not yet available. |
| MEDIUM | Imported source contains lint warnings | Removed unused imports without weakening lint configuration; replaced newly encountered explicit-any Square types and JSX lint errors. | Lint exits 0 with **218 warnings**, primarily remaining unused source code, hook dependencies and image guidance. Cleanup remains. |
| HIGH | Source workflows not connected to isolated LayeredFX data/provider services | Explicit preview notice and failing mutations prevent simulated saves or sends. | New Job Save as Draft displays integration-required error and retains entered values. Credentials alone will not complete missing backend implementation. |

## Current validation (exact output)

| Command | Result | Log |
|---|---|---|
| npm install --fetch-retries=0 --fetch-timeout=30000 | Exit 0, 475 packages audited, 0 vulnerabilities | [Install](logs/npm-install-dashboard.txt) |
| npm test | Exit 0, **101 passed / 0 failed** | [Tests](logs/test-verified.txt) |
| npm run typecheck | Exit 0 | [TypeScript](logs/typecheck-verified.txt) |
| npm run lint | Exit 0, 0 errors / 218 warnings | [Lint](logs/lint-verified.txt) |
| npm run build | Exit 0, real Next 15.5.25 build and standalone output | [Build](logs/build-verified.txt) |
| node scripts/dashboard-browser.mjs | Exit 0, 26 routes, normal Workspace tracking, mobile Profile navigation; no page errors | [Browser](logs/dashboard-browser.json) |
| node scripts/dashboard-interactions.mjs | Exit 0, three source forms, five Jobs views, six new-job tabs, truthful rejected save; no page errors | [Interactions](logs/dashboard-interactions.json) |
| node scripts/browser-smoke.mjs | Exit 0, homepage/Three.js and existing modules; no page errors | [Regression](logs/browser-smoke.json) |
| node scripts/production-smoke.mjs | Exit 0, production demo blocked, anonymous API 401s | [Standalone](logs/production-smoke.json) |

Command exit codes: [verification.json](logs/verification.json). This is browser/Next validation, not merely reducer/parser checks. Screenshots are in `screenshots/`, including Workspace, Orders, its creation sheet, Jobs and mobile Profile.

Final standalone verification was run with the dev server stopped. An earlier overlapping dev restart invalidated generated `.next/static` output; rebuilding and running the standalone check sequentially resolved it. The failed attempt is retained in `logs/production-smoke-retry.txt`.

The acceptance outline below still applies. Pipeline rule/history, conversion identities, Workspace/Plans permissions and optimistic concurrency remain covered by existing tests; these tests do not substitute for authorized live multi-user staging. Full source workflow implementation, canonical order/project/customer links, provider adapters, CMI job details, applied schema, RLS verification and container validation remain release blockers. No remote push, migration, Coolify, DNS or external provider action occurred.

## Prior checkpoint (historical)

The following records checkpoint 1. Its command outcomes describe that earlier increment; shared `*-verified.txt` and browser log paths now contain checkpoint 2's latest output above.

**Full migration is in progress; this is not production approval.** This checkpoint starts real CTRL+P implementation while preserving the supplied homepage and existing modules. No source feature has been approved for exclusion.

## Workspace and source evidence

The supplied folder had no `.git` directory, lockfile or installed dependencies. Created local baseline commit `7d49d26` and the separate `review/full-dashboard` worktree at `.review/integration`. The baseline application files were preserved. Reference checkouts are outside the compiled tree in the user's temporary directory. No remote repository was modified or pushed.

- CTRL+P: `ThePopOpp/ctrl-p`, `015a7b58b80e63ef87c73bec549a23242b88f3e3`.
- Channel Cast: `Qallus/Channel-Cast-OS`, `8cd1de0a6c3aacd2da08b0544a29e9df5a6044cf`.
- Static inventory: **22 CTRL+P dashboard pages / 93 API routes**, 41 Channel Cast admin pages / 106 API routes. This corrects an initial manual count of 23 CTRL+P pages. The JSON inventory records transitive imports, API references, table references, exported functions and discovered UI labels. It is not an exhaustive action-level acceptance test.

See `../migration/CTRL_P_DASHBOARD_PARITY.md`, `CHANNEL_CAST_MODULE_PARITY.md`, `INTEGRATION_MAP.md` and `SCOPE.md`.

## Findings, fixes and verification

| Severity | File / evidence | Fix / current state | Verification and remaining blocker |
|---|---|---|---|
| BLOCKER | app/admin; source inventory | The supplied app had only overview/Pipeline/Workspace/Plans, with none of the CTRL+P foundation migrated. Began Coupons management implementation and recorded all source routes/dependencies. | All other CTRL+P modules and supporting customer routes remain Not migrated. Full shell/theme/notifications/role mapping and canonical business identities still require integration. |
| HIGH | docs/LAYEREDFX_BUILD_MASTER.md, docs/CONTROL_P_INTEGRATION.md, CLAUDE.md and handoff prompts | Earlier selective-reuse/exclusion/lightweight directions conflicted with the request. Added authoritative additive scope and replaced the conflicting instructions while preserving safety/design rules. | Source parity remains the completion gate; no feature exclusions approved. |
| HIGH | components/operations/workspace.tsx: DocumentSurface keyed by updated_at | A state refresh could remount the editor and discard a dirty draft. Changed key to document identity; refresh only synchronizes clean content. Added monotonic content_revision on save/restoration and sends the draft's base revision to the command engine. | Unit test rejects concurrent saves at identical timestamps and verifies restoration increments revision. Existing documents default to revision zero. Global organization revision checks remain. Live multi-user scenario still unverified. |
| HIGH | components/operations/workspace.tsx: only the back link prompted before navigation | Sidebar/context links could lose unsaved edits. Added capture-phase link guard plus beforeunload protection, reused for Coupons forms. | Real browser edited Plate content, cancelled sidebar navigation, saved and refreshed successfully. Browser history/programmatic router navigation is not comprehensively guarded and remains a follow-up. |
| HIGH | source app/api/admin/coupons/route.ts: PATCH validates positive value but not percentage cap against existing type | Adapted coupon validation checks the merged record, finite values, precision, limits, immutable code, optional restrictions, booleans and expiry. Rejects unknown output fields. | Unit tests cover partial-edit/type-change bypass, nonfinite numbers, fractional max uses and clearing restrictions. |
| HIGH | source coupon API: unbounded body and no revision predicate | New LayeredFX API uses the existing verified session/membership, exact origin, 16 KB streaming limit, read-only-role rejection, org-scoped queries, field projection and revision CAS. Used coupons cannot be deleted. | Handler tests exercise denied auth/viewer/origin, oversized body, stale/read-write race, percentage bypass and used-coupon deletion. Auth/database boundaries are mocked in these tests; this is not live Supabase verification. Real anonymous API returns 401. |
| HIGH | node_modules/next/node_modules/postcss at 8.4.31 after initial install | npm audit reported 1 high and 1 moderate vulnerability. Pinned/overrode PostCSS to 8.5.28, retained Next 15, regenerated lockfile. | Final npm install: 0 vulnerabilities; npm ls confirms Next uses 8.5.28; final production build passes. Earlier nested override/update/dedupe attempts did not replace the old version and are retained in logs. |
| MEDIUM | next.config.ts | Next inferred C:/Users/jwate from an unrelated parent lockfile, then failed with EPERM while tracing. Set outputFileTracingRoot to the project working directory. | Final build exits 0 and generates .next/standalone/server.js. Original failed output retained. |
| LOW | eslint.config.mjs / generated next-env.d.ts | Named the config export; excluded Next's regenerated declaration file from lint. Application source retains the existing strict checks. | Final lint exits 0 with no warnings. Typecheck includes generated declarations and passes. |

## Actually implemented in this increment

Coupons: source-adapted field model, list/pagination, create/edit form, fixed/percentage discount configuration, restrictions/expiry/status, activate/deactivate and unused-coupon delete, under the existing shared LayeredFX shell and session. Server repository targets normalized `lfx_coupons`, not another generic JSON store. SQL is an **unapplied review draft**, dependent on isolated LayeredFX membership. No success is simulated when storage is absent.

Still required for Coupons: source order-history expansion/revenue summaries, order integration and atomic redemption, global totals across pagination, applied/verified schema, live browser CRUD and durable database persistence. Coupons remains **In progress**, not a completed source module.

Existing homepage files, assets, Three.js implementation and public root route have no source changes. Pipeline and Plans retain their implementation; Workspace received the draft/conflict fixes above. The full CTRL+P shell/theme is not yet ported; adding Coupons to the existing shell is only an integration increment.

## Commands and exact output

Environment: Windows, Node v24.15.0, npm 11.12.1. Final command exit codes are in `logs/verification.json`. Complete stdout/stderr are preserved in the linked files.

| Command | Result | Exact output |
|---|---|---|
| npm install --fetch-retries=0 --fetch-timeout=30000 | Exit 0; final audit 0 vulnerabilities | [Final installation](logs/npm-install-final.txt); initial failures and installs also retained |
| npm test | Exit 0; **97 tests passed, 0 failed** | [Tests](logs/test-verified.txt) |
| npm run typecheck | Exit 0 | [Typecheck](logs/typecheck-verified.txt) |
| npm run lint | Exit 0; no warnings | [Lint](logs/lint-verified.txt) |
| npm run build | Exit 0; Next 15.5.25; standalone output | [Build](logs/build-verified.txt) |
| node scripts/browser-smoke.mjs | Exit 0; no page errors | [Browser results](logs/browser-smoke.json) |
| node scripts/production-smoke.mjs | Exit 0 | [Production results](logs/production-smoke.json) |
| docker version | Exit 1; Docker Desktop Linux engine pipe absent | [Docker blocker](logs/docker-version-authorized.txt) |

The test suite now includes TypeScript-backed coupon tests, so it is no longer wholly dependency-free. `scripts/verify.mjs` runs the real project commands and records each exit code. Browser scripts use headless system Edge and disposable browser contexts; they do not access the user's browser profile.

## Acceptance outline from prompts/04-CODEX-OPERATIONS-REVIEW.md

1. Pipeline: existing tests cover direct command gates, skipped stages/nurture, admin override reasons, owner restrictions and won/lost/reopen history. Browser rendered all five views and stage settings. Full drag/detail/raw authenticated staging matrix remains.
2. Conversion/handoff: existing tests verify lead/contact/opportunity reuse and current plan handoff idempotency. The handoff is not the required CTRL+P Order/Project migration.
3. Record access: existing tests cover private documents/comments/plans/tasks, editor/viewer rules and direct-ID denial. Real separate-user/two-org Supabase tests remain.
4. Workspace: actual Plate renders, edit/save/refresh persists local demo content, sidebar cancellation preserves edits; conflict revision regression passes. Advanced blocks, multi-user sessions and complete history navigation behavior remain.
5. Plans: all four actual React views rendered; existing task/group/label/member/completion/archive tests passed. Real cross-view editing and source feature gaps remain.
6. API/production: real anonymous Coupons and operations API GETs return 401. A built production server with LFX_OPERATIONS_MODE=demo still displays the configuration gate and never serves an anonymous demo. No live Supabase authentication or RLS claim is made.
7. Homepage: actual `/` renders, Three.js canvas mounts, desktop/mobile screenshots captured, reduced-motion preference enabled in browser tests. Homepage source is unchanged. Full GPU/performance/accessibility/device coverage remains.

## Remaining release blockers

- Entire CTRL+P dashboard parity, full Channel Cast module gaps, canonical customer/order/project/document/Plan relationships and public estimate intake remain required.
- Live LayeredFX-only database configuration, reviewed/generated migrations, membership/role mapping, RLS-denied browser access and service-role persistence must be verified on explicitly authorized staging. Coupon SQL has not been executed or claimed validated by a database.
- Provider integrations and source customer-facing dependencies are not yet migrated. No communications, payments, calendar confirmations or source-company data were used.
- Docker engine unavailable; container build not run. Next standalone generation and production server smoke passed, but are not a container/deployment test.
- No remote push, live SQL, DNS, Coolify deployment or external provider action occurred.

Next implementation dependency: reconcile CTRL+P users/customers/orders/projects and shared permissions/shell, then port those source workflows and connect Coupons usage plus Pipeline handoff/Plans. Keep the complete source inventory; do not replace those workflows with the existing simplified handoff.
