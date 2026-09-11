# Accumulating object selection - 2026-09-11

MEDIUM - components/layeredfx/wall-studio.tsx: individual confirmation replaced with automatic additive selections. Rapid taps queue serial model requests (bounded to 32 waiting taps) instead of being ignored while inference runs. Each completed mask joins the kept-object list; cancellation clears remaining requests and preserves completed selections. Photo changes clear the queue and terminate the old worker. Materials remain hidden throughout selection. Instructional copy explains tapping multiple furniture parts.

LOW - studio.css: tool and action buttons in the selection panel now occupy one row each.

Verification: Edge real SlimSAM execution accepted two rapid taps on the commercial sample and accumulated two masks without confirmation. Verified Done enabled only after processing and a single computed tool-grid column. Evidence: logs/studio-auto-selection.json, screenshots/studio-multi-selection.png. Required checks recorded in *-verified.txt. Selection quality remains model-dependent; paint, outline, erase and removal remain available.

# Wall Studio selection-first workflow - 2026-09-11

MEDIUM - components/layeredfx/wall-studio.tsx: material and numbered handles previously appeared before object selection. Reordered guided flow to photo, keep objects, mark wall, material, estimate, customize and review. New photo resets completion gates. Tap selection is active immediately after choosing a photo. Original image stays visible with green mask overlays; materials remain unavailable until objects are confirmed or explicitly skipped and the wall area is confirmed. Controls include visible kept-object list, remove, selection status, brush/outline alternatives and confirmation. Handles have no numbers and only appear in Mark wall, with explanatory copy. Mobile selection controls appear above the canvas.

Verification: browser compared the pre-selection canvas to the original image pixel-for-pixel; verified locked material access, active tap tool, brush selection, foreground count, wall-only handles, material unlock and mobile width. Actual SlimSAM selection of the sample couch and confirmation passed. Evidence: logs/studio-guided-browser.json, logs/studio-auto-selection.json, screenshots/studio-select-*.png. Required validation outputs are in *-verified.txt. Photo model quality on other objects/devices remains a variable; manual refinement is retained.

# Wall Studio workspace and scheduled top bar - 2026-09-11

- MEDIUM - components/layeredfx/wall-studio.tsx, studio.css: constrained preview replaced with full-width workspace, tool rail, guided steps and responsive properties panels. Retained perspective corners, foreground masking, model selection, local save and PNG export. Added two generated sample room photos and text/shape/symbol graphic layers with placement, rotation, color, visibility and ordering.
- MEDIUM - lib/studio/catalog.ts and studio-library.tsx: all requested application/category groups are selectable, with six illustrative color concepts per category plus six source-attributed Wilsonart HPL woodgrains. Concepts are not a verified vendor SKU catalog. Actual broader vendor imagery, availability and approved rates remain outstanding.
- MEDIUM - studio-estimate.tsx: dimensions, openings and material waste feed separate material/labor totals. Added height/access, removal, location and difficulty questions with entered labor surcharge, removal rate and travel charge. Rates are user-entered planning inputs; automatic business pricing awaits supplied rates. No generated prices represented as LayeredFX prices.
- HIGH - lib/topbar and app/api/topbar: server-persisted local notices, admin-only production management, bounded bodies, origin validation, revision conflicts, safe links, Phoenix start/end scheduling and priority. Public endpoint returns only currently eligible message/link fields. Frontend refreshes every 30 seconds. Production SQL is a review draft; no live migration performed.
- LOW - shared Footer now appears across home, editorial/service/blog, contact, booking, studio and authentication pages. Reduced h2 letter spacing compression. Original homepage content and animation preserved.
- Verification: browser workflow verified sample selection, Wilsonart selection, 200 sq ft estimate with waste and labor surcharge ($1,820), custom text, PNG export, device save, mobile width, dark theme, public notification publication/cleanup and Content tab. Evidence: logs/studio-upgrade-browser.json and screenshots/studio-editor-*, studio-materials.png, topbar-manager.png. Required install/tests/typecheck/lint/build exact logs are stored in logs/*-verified.txt.
- Remaining: real phone camera/device coverage; model segmentation quality on varied objects; production notification table/staging verification; supplied pricing rules and expanded real vendor catalog. Generic sample photos are AI-generated examples. No deployment, remote push or live database changes.

# Services hover mega menu - 2026-09-11

LOW - components/layeredfx/header.tsx and frontend.css: Services opens on mouse hover with a short exit delay, retaining click/touch and keyboard operation. Removed the Services chevrons and all mega-menu arrows. Grouped the ten service links into three columns; a bottom CTA spans all columns with Wall Studio and consultation links.

Verification: npm install, all 151 tests, typecheck, lint and build passed. Browser checks on the main app at localhost:3000 verified hover entry, movement into links, pointer exit, Enter/Escape, absence of arrow SVGs, three computed grid columns, full-width CTA, and light/dark rendering. Evidence: logs/mega-menu-browser.json, logs/mega-menu-install.txt and screenshots/mega-menu-*.png. No remaining blockers for this menu change.

# Navigation, blog and Wall Studio - 2026-09-11

- MEDIUM - Public navigation: Services now opens a desktop mega menu and mobile expandable list for ten dedicated service routes. Inspiration links to a public archive with individual post routes. About Us has its own page. Navbar consultation action opens /book; shared estimate triggers open /studio. Original homepage and Three.js content remain.
- HIGH - Blog editor persistence/publication: connected the existing editor to /api/blog/manage, with create/edit/publish/schedule/archive/delete, unique slugs, bounded sanitized HTML, optimistic revision conflict checks and admin authorization in production. Draft/archived/deleted/future posts are excluded from public routes. Local saves use .local-data/blog.json with an exclusive lock and atomic replacement; production uses the reviewed server-only lfx_blog_store adapter. Fixed a race that allowed New post before the current revision loaded. Blog schema is not applied to live Supabase.
- MEDIUM - Wall Studio: browser-worker SlimSAM selection, confirm/discard, foreground visibility layers, manual mask correction, zoom, rotation, six Wilsonart source-attributed material swatches and multi-wall planning estimates. Actual model execution passed in Edge. Original swatches replace padded thumbnails; overlapping triangle rasterization avoids hairline gaps. Foreground furniture is not deducted from material quantities.
- Verification: 151 tests, typecheck, lint and Next.js production build passed; lint has 225 warnings and zero errors. Install audits 558 packages with zero vulnerabilities. Exact command output is in logs/navigation-install.txt and shared *-verified logs. Browser evidence: navigation-studio-browser.json, blog-editor-browser.json, studio-auto-selection.json and screenshots/studio-upgrade.png. Initial validation caught stale estimate-dialog references and framework link errors; fixed and rerun. Existing editor UI creation/publication and estimate redirect passed after the loading-race fix. Standalone production smoke also passed: public pages returned 200 and unauthenticated blog management returned 401.
- Remaining blockers: live blog table/auth integration requires staging verification; no migration, deployment or remote push was performed. Physical phone camera and broad model quality/device coverage remain. Rates are editable planning inputs; no vendor prices or stock claims. Sources: Wilsonart official product/image URLs in lib/studio/wilsonart.json; ControlP public/designer.html reviewed locally for layers, rulers and undo workflow; Hugging Face SlimSAM model card and Supabase Data API security documentation reviewed. Photos are processed on device; model download requires connectivity.

# Local checkout synchronization - 2026-09-11

HIGH - Main project checkout and local dev server: the VS Code root was on baseline `7d49d26`, while GitHub main and the review worktree were on `b7db1f6`. Port 3000 was served by the root's older Next.js process. Preserved local declarations, lockfile and logos in `.review/sync-backup-20260911`, fast-forwarded the root, installed current dependencies and restarted the server from the root. Local `.vscode` files remain untouched. All supplied logo files matched the incoming repository files.

MEDIUM - `tsconfig.json`, `eslint.config.mjs`: exclude the nested `.review` worktree so root validation does not include another checkout's source and generated files. Fix authored in the separate review worktree.

Verification: npm install succeeded (504 packages audited, zero vulnerabilities); all 144 tests passed; typecheck, lint and production build exited 0. Lint retains 219 warnings and zero errors. Exact outputs are in `logs/*-verified.txt`, `logs/verification.json` and `logs/local-sync-install.txt`. Browser checks confirmed HTTP 200 for `/`, `/admin`, `/book`, `/contact` and `/studio` on both localhost and 127.0.0.1:3000; the frontend theme toggle/My Account and full dashboard navigation/logo are present. Evidence: `logs/local-sync-browser.json`. An initial browser check targeted a deliberately hidden booking intro heading; corrected to the visible step heading and reran successfully.

Remaining blockers: this synchronization does not change previously documented live Supabase/provider integration limitations. No migrations or deployment changes were made.

# Material animation background - 2026-09-10

LOW - `components/layeredfx/layeredfx.css`: the animated material section in the user's screenshot had an opaque right-column background, rounded corners and radial glow. Removed the fill, rounding and glow so the existing transparent Three.js renderer blends directly into the section. Updated `components/layeredfx/frontend.css` so labels inherit readable dark-theme colors on the newly transparent surface. Animation and controls remain unchanged.

Verification: browser computed styles confirm transparent background, no pseudo-element glow and zero corner radius in both themes, with the real Three.js canvas present. Evidence: `logs/material-studio-transparent.json` and `screenshots/material-studio-transparent-*.png`. Required install output: `logs/material-studio-transparent-install.txt`; test/typecheck/lint/build output in shared verified logs.

---

# Booking sequence and frontend Wall Studio - 2026-09-10

Implemented `/studio` with the LayeredFX frontend header and light/dark styling. Source-reviewed against CTRL+P commit 015a7b58b80e63ef87c73bec549a23242b88f3e3: VisualizerStage, StudioApp, snapshot, homography and demo-room constants. Homography and textured triangle projection are reused with attribution; triangle clipping overlaps slightly to eliminate seams. Projected textures are cached during mask painting.

Foreground workflow: four perspective corners (pointer and keyboard), photo upload/phone capture, procedural sample materials or custom uploaded graphic, keep-in-front brush, polygon outline, restore-finish brush, undo/redo, mask overlay, original/design comparison, local saved look and PNG download. Masks reveal the untouched original image beneath the finish, preserving original foreground pixels. Switching materials retains masks. Photo input is JPEG/PNG/WebP up to 24 MB, resized to a 1600px long edge. Saved looks use device IndexedDB, not cloud storage. Masks cap at 200 edits without silently dropping earlier objects. Automated semantic object segmentation, multi-project cloud persistence, purchasable catalog/pricing and live cart integration are not implemented; sample finishes are explicitly illustrative. Physical phone capture requires device verification.

Booking now follows the reference sequence: expandable appointment cards with durations, calendar/month navigation, 15-minute preferred start-time choices in America/Phoenix, and customer details. Details persist when going back. LayeredFX-specific consultation types replace unrelated source-company services. Availability, buffers and existing bookings are explicitly not connected: final action prepares a portal request, not a reserved appointment or automatic notification.

Findings fixed: MEDIUM - canvas allocation originally ran during server rendering; browser guard added and production build/direct-route checks required. LOW - mobile appointment card minimum sizing caused overflow; constrained grid items. LOW - projected triangle seams; expanded clip edges. LOW - some homepage section links were relative hashes on other routes; corrected and added Wall Studio navigation.

Verification evidence: `logs/studio-browser.json` (pixel equality of original foreground, material switching, undo/redo, saved look restoration, PNG export, mobile dark), `logs/studio-upload-browser.json` (synthetic photo upload, polygon foreground, custom graphics), updated frontend request handoff check, original Three.js homepage/dashboard browser smoke. Required install and full test/typecheck/lint/build outputs are in `logs/studio-booking-install.txt` and shared verified logs. Live Supabase/provider changes: none.

---

# Frontend navigation, Contact and booking entry - 2026-09-10

Implemented shared frontend light/dark toggle with persisted preference, theme-appropriate supplied logos, and a keyboard-accessible My Account disclosure with Login/Register. Navigation includes Book a consultation and Contact; section links point back to the homepage from other routes. Login/Register share the new header. The dark top bar uses LayeredFX copy rather than source-company claims.

Added `/contact` and `/book` using the screenshot and locally reviewed CTRL+P contact/booking source as layout references. The remote contact page could not be fetched. Contact collects project details; booking guides consultation choice, preferred date/time and details. Both save a bounded draft in session storage and open the existing portal composer for explicit review/submission. Drafts clear after successful submission. This does not introduce anonymous public message delivery or reserve calendar slots. In local preview, final requests/messages remain browser-only. In live mode, portal authentication and existing server authorization remain required. No live Supabase changes.

The previous `/book` missing-route finding is resolved. Availability-backed scheduling, calendar conflicts, appointment confirmation and real provider integration remain pending. Business phone/address/hours were not invented; account messaging and consultation links serve as contact methods.

Verification: `scripts/frontend-pages-browser.mjs` checks both public-to-portal form handoffs, persisted submitted previews, account links, theme persistence and mobile overflow across homepage/Contact/book/Login/Register. Required checks and original-homepage smoke results are in `logs`. Added dark/light screenshots in `screenshots/frontend-*`.

---

# Shared primary button palette - 2026-09-10

LOW - `app/globals.css`, `components/admin/dashboard.css`, `components/layeredfx/layeredfx.css`, `components/portal/portal.css`: primary buttons used unrelated olive/lime/ink backgrounds across shells. Added shared HSL brand action tokens matching sidebar #202b28 and text #c2cdc5. Both dashboard themes, public primary actions and customer/partner/auth primary actions use these values. Hover uses navigation #314037 / #eff7e9. Dark-mode text-primary links keep readable pale text after the primary background token changes. Semantic destructive and secondary button variants retain their purpose; the previously requested lime FAB icon remains.

Verification: browser computed styles checked Content, Analytics, Orders, Production, Pipeline, homepage, login and customer bookings (14 page/theme combinations); exact observed buttons and colors in `logs/primary-buttons-browser.json`. Required install output: `logs/primary-buttons-install.txt`; full test/typecheck/lint/build outputs in shared verified logs. Existing scheduling and live Supabase blockers below remain unchanged.

---

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

Final validation for this increment: npm install passed (558 packages, zero vulnerabilities); 156 tests passed; typecheck passed; lint passed with 233 warnings and zero errors; production build passed. Standalone production smoke passed, including 401 for anonymous top-bar management. The first smoke attempt overlapped build finalization; rerunning after build completion passed.

Selection-first validation: npm install, 156 tests, typecheck, lint (zero errors) and production build passed.

Accumulating-selection validation: npm install, all 156 tests, typecheck, lint (zero errors) and production build passed.
