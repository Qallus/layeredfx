# Customer and partner portals

## Routes and behavior

- `/login`, `/register`: public frontend account pages, inspired by CTRL+P's split login layout and using supplied LayeredFX artwork. Homepage desktop/mobile navigation links to both. Staff login remains `/admin/login`.
- `/portal`: residential/commercial account workspace. Sections: bookings, products, services/installation, shared project notes, photos/videos, private account-to-team messages and profile.
- `/partner`: general contractor, affiliate and vendor workspace, adding referrals and vendor submissions. **All new partner accounts require staff approval**, as requested by the owner.
- `/admin/portals`: active staff can review account requests and send replies. Only administrators approve/suspend accounts. Read-only staff cannot access portal records. The page currently loads the latest 200 accounts; pagination is required before exceeding that scale.

Bookings, products, services, referrals and vendor submissions create **requests**. They do not reserve calendar slots, place paid orders, commit pricing, dispatch installers, calculate commissions or synchronize existing source modules. Staff can confirm, decline or complete requests. Catalog entries describe existing LayeredFX service categories; they are not an inventory feed. Notes are explicitly shared with the LayeredFX team. Messages are account-to-team, not arbitrary customer-to-customer DMs; reload to receive replies.

## Account security

Portal sessions use separate HttpOnly `lfx_portal_access` / `lfx_portal_refresh` cookies. Every portal data request verifies the Supabase user and email confirmation, then loads the account within the configured LayeredFX organization. Authorization never reads user-editable metadata. Registration creates only the selected customer/partner classification; it cannot create staff membership. Partners start pending, customers active after verified login. Suspended accounts cannot read/write through portal APIs. Pending partners may update their profile but cannot submit requests or media.

State is stored per `(org_id,user_id)` with optimistic revision comparison. Customer-supplied account IDs, status and authorship are ignored. Server commands allowlist writable fields. Staff access uses the existing verified Supabase user + active LayeredFX operations membership. Origin checks and bounded JSON bodies protect mutations. Auth attempts have a per-process email rate limit; production must also use gateway/provider abuse protection across instances.

Media uses a private `lfx-portal-media` bucket, server-generated organization/user paths, 20 MB streaming upload limits, MIME/signature checks and 60-second signed viewing URLs. Uploads allow JPEG, PNG, WebP, MP4 and WebM. No public bucket or direct browser table/storage grants. A failed metadata revision save triggers upload cleanup; failed storage cleanup may leave an unreferenced object and needs operational reconciliation. Each account is capped at 100 media records and 1,000 timeline items. Media deletion/retention policies and malware scanning remain future work.

## Local review and live activation

During development, `LFX_PORTAL_MODE` defaults to demo unless set to `supabase`. Separate customer and partner browser-local previews are linked from the login page. Passwords are never stored or simulated; login/registration submission is disabled in preview mode. Media persists in IndexedDB, other preview data in localStorage. Production cannot enable this bypass regardless of the environment setting.

Live activation requires the existing isolated `LFX_SUPABASE_*` and `LFX_OPERATIONS_ORG_ID` variables. The SQL is a **review-only draft** at `sql/portals-review-draft.sql`; it has not been applied. It enables RLS and revokes direct anonymous/authenticated access, granting only service-role table access. Review storage policies to ensure no existing broad policies grant direct access to this bucket.

Configure Supabase email confirmation and SMTP, the site URL and allowlisted `/login` redirect before testing registration. Users confirm their email and then sign in with their password. An interrupted signup between Auth and account creation needs staff reconciliation; it is reported as incomplete, not silently successful. Password reset, OAuth/social login, magic links, organizational subusers and public business-card hosting are not part of this increment. No live Auth, database or Storage request has been validated against a configured LayeredFX project yet.

Staging acceptance: two distinct customer users cannot read/write each other's account or media; a pending contractor cannot submit until approved by an administrator; staff/viewer/expired-token and cross-origin checks; email confirmation, refresh and logout; stale concurrent writes return 409; upload, signing and cleanup; account-to-team replies round-trip; direct Data API and Storage access denied. Do not apply migrations or send auth emails until the LayeredFX target is confirmed and authorized.

## Verification and source

Domain and mocked API boundary tests cover account isolation, verified-session requirements, origin/body limits, stale revisions, pending/suspended users, self-approval denial, request status rules and author spoofing. Edge browser tests exercise preview persistence and desktop/mobile layouts. Production smoke verifies portal redirects and unauthenticated API denial; this is not a live Supabase test.

Reference reviewed: CTRL+P checkout `015a7b58b80e63ef87c73bec549a23242b88f3e3`, `app/login/page.tsx`. The new implementation uses original LayeredFX copy instead of CTRL+P customer quotes, metrics or business claims.

Supabase references checked: [changelog](https://supabase.com/changelog), [signUp](https://supabase.com/docs/reference/javascript/auth-signup), [getUser](https://supabase.com/docs/reference/javascript/auth-getuser). No relevant breaking change identified for the installed client and APIs used here. The markdown changelog fetch was unsupported, so the HTML index was reviewed.
