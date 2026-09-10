# Dashboard page integration — 2026-09-10

These are source client ports for local review, not completed server/provider migrations. The original homepage and Channel Cast adaptations remain. All 19 pages requested in the latest dashboard review are reachable from the grouped navigation.

| Requested page | Route | Source / current behavior |
|---|---|---|
| Communication | /admin/communications | CTRL+P communications client, conversations/call and messaging controls |
| Analytics | /admin/analytics | CTRL+P configured analytics section |
| Orders | /admin/orders | CTRL+P order list/Kanban/calendar, creation and detail components |
| Jobs | /admin/jobs | CMI List/Table/Card/Kanban/Calendar; /new six-tab form and /map |
| Bookings | /admin/bookings | CTRL+P overview/list/calendar/availability and appointment-type controls |
| Designers | /admin/designers | CTRL+P directory and schedule |
| Installers | /admin/installers | Adaptation of CTRL+P Designers directory/schedule; no dedicated source installer page was found |
| Payments | /admin/payments | CTRL+P invoice/payment/refund forms; provider execution unavailable |
| Customers | /admin/customers | CTRL+P customer screen; canonical visible contact/member identities |
| Users | /admin/users | CTRL+P user management client |
| Products | /admin/products | CTRL+P catalog management client |
| Wall Studio | /admin/wall-studio | CTRL+P Wall Studio administration client |
| Coupons | /admin/coupons | Prior coupon adaptation, protected server repository, unapplied SQL draft |
| Artwork | /admin/artwork | CTRL+P files/proof management client |
| Marketing | /admin/marketing | CTRL+P marketing client |
| Blog Posts | /admin/blog | CTRL+P blog management client |
| Agents | /admin/agent | CTRL+P agent UI; execution unavailable |
| Settings | /admin/settings | CTRL+P settings client |
| Profile | /admin/profile | CTRL+P profile form adapted to current LayeredFX actor |

Also mounted source Projects (/production-schedule), Production, Messages, Shipping and Content. Pipeline, Workspace and Plans keep their existing routes. Sidebar groups scroll independently; the shared light/dark theme applies to imported dialogs and selects. Workspace title tracking no longer inherits the homepage's negative display tracking.

## Evidence and boundaries

- CTRL+P commit `015a7b58b80e63ef87c73bec549a23242b88f3e3`; Channel Cast commit `8cd1de0a6c3aacd2da08b0544a29e9df5a6044cf`; CMI commit `23320abb158e26f0945c2f1ce2f513f02649aa70`.
- Namespaced source files: `ctrlp/`, `cmi/`; file manifests: `ported-client-files.json`, `cmi-client-files.json`. Import scripts record the initial copy; subsequent integration fixes are in the destination files, so do not rerun imports over them without review.
- The copied client screens use the existing LayeredFX actor/provider. Their old sidebars and headers were removed. Source demo-company records and database credentials were not copied.
- The compatibility browser client never contacts Supabase tables or Storage. Its session-shaped object is only for source client compatibility; server authorization never trusts it. The actual route boundary verifies the existing cookie session and membership.
- New workflow requests are isolated under `/api/ctrlp/`. The catch-all enforces membership, origin, read-only restrictions and bounded write bodies, then returns 503. It does not implement the source handlers. No request is forwarded to the source company.
- Local review uses explicit empty source collections and existing visible LayeredFX identities. Writes fail with a clear integration-required message. No successful message/payment/booking/job save is simulated.
- **Remaining implementation:** normalized database schema/repositories, role mapping, action handlers, history/concurrency validation, business-record links, file storage, provider adapters, complete CMI job details and customer-facing source dependencies. Supplying Supabase details alone will not implement those missing workflows.
- Local form/view checks prove rendering and interaction only. They do not prove live CRUD, reporting accuracy, delivery, payments, RLS or staging readiness. See `../reviews/current-review.md`.
