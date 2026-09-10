# Integration map

Source pins: CTRL+P `015a7b58b80e63ef87c73bec549a23242b88f3e3`; Channel Cast `8cd1de0a6c3aacd2da08b0544a29e9df5a6044cf`.

## Current implementation

- The sole public `/` route and supplied homepage/Three.js components remain intact.
- Existing `/admin/(operations)` route group provides one server-checked LayeredFX session and one shell for Pipeline, Workspace, Plans and the first CTRL+P Coupons adaptation.
- Cookies remain `lfx_ops_access` / `lfx_ops_refresh`; `currentActor` verifies the Supabase user and active LayeredFX organization membership. Coupons does not introduce the source browser token/session or source business profile.
- Coupon management uses a separate normalized `lfx_coupons` table through a server-only repository, the same organization/member identities and only `LFX_` database configuration. The SQL is an unapplied review draft. No production fallback or browser data policy is added.
- Existing Channel Cast adaptations still use the bounded operations JSONB store. They are **not yet reconciled** with CTRL+P's normalized business tables. The full integration must replace that gap deliberately, with migration and ID mapping, not a second disconnected CRM.

## Canonical identity and relationship contract

| Record | Required canonical model | Current state |
|---|---|---|
| Users/staff | LayeredFX auth UUID, active org membership, mapped source roles | Existing admin/staff/viewer identity used by Coupons and operations; full CTRL+P permission matrix pending |
| Customers/contacts | One customer/contact ID reused by leads, orders and opportunities | Existing operations contact IDs only; CTRL+P customer migration/mapping pending |
| Leads/opportunities | Idempotent lead conversion, stable stage/history IDs | Existing engine implemented and unit tested; public intake pending |
| Orders/projects | Existing CTRL+P order and production-schedule semantics, canonical customer FK | Not migrated. Current won handoff is not a full Project |
| Plans/tasks | Many Plans per Project, one task set across four views | Existing opportunity link; canonical Project FK and multiple-plan UX pending |
| Documents | Authorized references to customers, opportunities, orders, projects and Plans | Existing opportunity link only; other link types pending |
| Coupons | Organization-qualified code/ID; source order coupon_id; transactional usage | Management adaptation implemented; order history/redemption and order FK pending |
| Bookings/media/communications | Reuse CTRL+P identities, protected storage and provider execution | Not migrated; existing manual timeline logs do not substitute for these |

## Route preservation

CTRL+P dashboard routes retain `/admin/...`; Projects specifically retains `/admin/production-schedule`. Channel Cast `/app/admin/pipeline`, `/workspace`, `/plans` become the existing `/admin/...` destinations. Only migrated routes exist today; no placeholder page is counted as parity. Source customer/dashboard routes and action links are dependencies to migrate with their owning module.

## Configuration and acceptance

Use `../channel-cast/SETUP.md` for the existing isolated session/store configuration. Coupon SQL depends on `lfx_ops_members`; it has RLS enabled with direct anon/authenticated access revoked. Only active server-verified staff/admin may mutate. Coupon edits require revision, have field allowlists and bounded body parsing, and return 409 on stale writes. Used coupons are deactivated to preserve history. Schema execution, PostgREST persistence and direct browser RLS denial remain unverified.

No provider configuration has been copied. Payment, messaging, voice, booking, storage, vendor fulfillment, notifications and Agent integrations remain required. Preserve their implementation when ported, disable only actions requiring absent LayeredFX configuration, and never report false success. No external action or deployment was performed.
