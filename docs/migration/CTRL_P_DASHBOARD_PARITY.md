# CTRL+P dashboard parity

Source: ThePopOpp/ctrl-p, commit `015a7b58b80e63ef87c73bec549a23242b88f3e3`. Reference checkout only; no source data or environment files imported.

This inventory preserves the full required scope. Static dependency discovery is not behavior verification. No feature is excluded. All nested API paths, imported components, table references and discovered UI labels are retained in [source-inventory.json](source-inventory.json). Provider endpoints and dynamically assembled paths require further manual tracing.

| Source route | Primary component | Transitive dependency evidence | Status |
|---|---|---|---|
| /admin/agent | components/admin/admin-agent.tsx | 16 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/analytics | components/admin/admin-section-page.tsx | 15 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/artwork | components/admin/admin-artwork.tsx | 15 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/blog | components/admin/admin-blog.tsx | 17 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/bookings | components/admin/admin-bookings.tsx | 18 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/communications | components/admin/admin-communications.tsx | 34 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/content | components/admin/admin-content.tsx | 17 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/coupons | components/admin/admin-coupons.tsx | 18 API references; 13 direct table references | In progress |
| /admin/customers | components/admin/admin-customers.tsx | 15 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/designers | components/admin/admin-designers.tsx | 19 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/marketing | components/admin/admin-marketing.tsx | 16 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/messages | components/admin/admin-messages.tsx | 22 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/orders | components/admin/admin-orders.tsx | 16 API references; 13 direct table references | In progress: client ported; server pending |
| /admin | components/admin/admin-dashboard.tsx | 15 API references; 13 direct table references | Existing operations overview retained; source dashboard not mounted |
| /admin/payments | components/admin/admin-payments.tsx | 17 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/production | components/admin/admin-production.tsx | 15 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/production-schedule | components/admin/admin-production-schedule.tsx | 19 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/products | components/admin/admin-products.tsx | 18 API references; 12 direct table references | In progress: client ported; server pending |
| /admin/settings | components/admin/admin-settings.tsx | 16 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/shipments | components/admin/admin-shipping.tsx | 15 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/users | components/admin/admin-users.tsx | 17 API references; 13 direct table references | In progress: client ported; server pending |
| /admin/wall-studio | components/admin/admin-wall-studio.tsx | 16 API references; 13 direct table references | In progress: client ported; server pending |

Current page-level mapping, source pins, verification and remaining backend work: [Dashboard pages](DASHBOARD_PAGES.md). Client ports do not establish completed feature parity.

## Coupons adaptation

Source: components/admin/admin-coupons.tsx, app/api/admin/coupons/route.ts, app/api/admin/coupons/[couponId]/orders/route.ts, supabase/migrations/20260424000001_initial_schema.sql.

Actual source behavior: list with active/inactive and usage counts; create/edit drawer; immutable code; fixed/percentage discounts; minimum order, maximum use and expiry; activate/deactivate; delete confirmation; expand orders with discounts and paid revenue.

Destination: app/admin/(operations)/coupons/page.tsx, components/admin/coupons.tsx, app/api/admin/coupons/route.ts, lib/admin/coupons.ts, lib/admin/coupon-repository.ts. Adapted management logic and fields, shared LayeredFX shell/session, labeled Radix dialog, bounded server JSON, allowlisted fields, organization-scoped normalized storage, compare-and-swap updates/deletes. Used coupons must be deactivated to preserve history.

Remaining: order-history expansion, coupon application/redemption, manual order integration, source totals across all pages, schema execution, real authenticated persistence and browser CRUD. The schema is a review draft, not an applied migration. Status: In progress.

## Source implementation limits to verify

Analytics renders AdminSectionPage with config-driven panels/actions; a button or config panel does not prove implemented analytics behavior. Each source module needs action-level acceptance before migration status advances. Projects is /admin/production-schedule; Plans will extend it. Content exists as a route but is absent from the source navigation groups and must remain in scope.

## Verification

See ../reviews/current-review.md and logs for actual commands and outcomes. The mounted dashboard client screens are in progress; nested actions, integration providers and customer-facing dependencies remain required. No module has been approved for exclusion.
