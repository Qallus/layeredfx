# LayeredFX operations setup

## 1. Local preview

Use Node 22+, install dependencies and run `npm run dev`. Open `/admin`. By default the development server supplies a synthetic admin actor and the browser stores changes under `layeredfx:operations:v2`. There is no transmission to Supabase in this mode and no cross-device sync.

The public homepage still uses the existing Three.js/shadcn implementation. Its estimate dialog remains a local preview. Do not enter real customer information in the unauthenticated demonstration.

To reset the demo, first export any test work worth retaining, then delete only the `layeredfx:operations:v2` local-storage key in developer tools and reload. Do not clear unrelated app storage. This procedure is for synthetic demo data only; no “reset production” endpoint exists.

## 2. Prepare separate storage and authentication

The target must be a **LayeredFX-only Supabase project**, not the Channel Cast or ControlP project. No source secrets should be copied.

Review `supabase/migrations/20260910_layeredfx_operations.sql` against that target. It creates only `lfx_ops_members` and `lfx_ops_store`. Execute it only after confirming the project identity and backups. This delivery did not execute SQL remotely.

Create a user through that project's Supabase Authentication administration. Choose a new organization UUID (for example, `crypto.randomUUID()` from Node). Insert the user's exact auth UUID as an active member in `lfx_ops_members`, using the commented structure in `supabase/bootstrap-example.sql`. Set role to `admin` for the initial owner. Add other authorized people with role `staff` or `viewer`.

There is no public self-registration, role-change UI, password-reset UI or member invitation sender in this increment. A successful auth login without an active membership is denied.

## 3. Server-only environment

Add the following in `.env.local` for local authenticated tests, and in the Coolify application's **runtime** environment for production:

```dotenv
LFX_OPERATIONS_MODE=supabase
LFX_SUPABASE_URL=https://YOUR-LAYEREDFX-SUPABASE-HOST
LFX_SUPABASE_ANON_KEY=YOUR-LAYEREDFX-PUBLIC-ANON-KEY
LFX_SUPABASE_SERVICE_ROLE_KEY=YOUR-LAYEREDFX-SERVER-ONLY-SERVICE-ROLE-KEY
LFX_OPERATIONS_ORG_ID=YOUR-NEW-ORG-UUID
NEXT_PUBLIC_SITE_URL=https://layeredfx.com
LFX_ALLOWED_ORIGINS=https://www.layeredfx.com
ALLOW_INDEXING=false
```

The adapter uses Supabase Auth and PostgREST. The supplied API-key names target the legacy anon/service_role key format also used by self-hosted Supabase. Confirm key compatibility on your instance before launch. Tokens and service keys stay server-side; auth cookies are HTTP-only and secure in production. Do not expose a service key in `NEXT_PUBLIC_*`, the browser, build logs, documentation or repository files.

`NEXT_PUBLIC_SITE_URL` is also used at homepage build time. Ensure its production origin and the runtime origin match. Configure HTTPS and the canonical domain before testing login. Add staging's exact origin to `LFX_ALLOWED_ORIGINS` when needed; do not use wildcards. Development permits localhost:3000 and 127.0.0.1:3000. Other ports must be added explicitly.

## 4. Database access model

Both tables have RLS enabled with **no anon/authenticated policies** and explicit privilege revocation. Direct browser access is intentionally denied. The Next.js server verifies the Supabase user and active organization membership on each operation, then accesses this isolated store using a server-only service role.

This service role bypasses RLS. Therefore the server's `currentActor`, `visibleState`, per-record `access`, allowed command dispatch and revision checks are mandatory security boundaries. Never replace the API with a browser-side direct read or generic whole-state write.

Admin sees all organization records. Staff sees all sales opportunities and team records, plus owned/invited private documents/plans. A global viewer cannot mutate; document/plan-specific viewer membership also prevents editing. Private document comments and private-plan tasks are filtered with their parent records before response.

Each successful command increments a global organization revision. The write is conditional on the prior revision. Conflicts return HTTP 409 and do not overwrite a newer save. Reload deliberately and reapply the intended change. This is optimistic concurrency, not live collaborative editing.

## 5. Production behavior

`npm run build` / `npm start` and Docker production always require authentication. Setting `LFX_OPERATIONS_MODE=demo` cannot make a production dashboard public. An unconfigured production `/admin` displays a setup notice; `/` remains available.

The existing Dockerfile serves standalone Next.js on container port 3000, under a non-root user, with `/api/health` as a process health check. It does not prove database/auth readiness. Add an authenticated smoke test after deployment. Do not make secret-dependent build-time requests or place runtime credentials in Docker build arguments.

Log out clears the browser's local session cookies. Global token/session revocation and account lifecycle management remain Supabase administration responsibilities. Refresh runs through the server and rechecks active membership. Review session lifetimes and any organization MFA policy before production.

## 6. Mandatory staging acceptance

Install/lock dependencies, then run typecheck, lint, tests and production build. Check actual Plate editor APIs against the installed packages, plus Radix modals and the existing Three.js canvas. Check desktop and mobile layouts, keyboard interaction, drag fallback and unsaved edits.

Exercise the real authenticated API with separate admin/staff/viewer users and two organization IDs:

- Signed-out requests denied; inactive and non-member accounts denied.
- Cross-org records never accessible. Private documents/comments and plans/tasks absent from other staff responses.
- Viewer edits rejected from raw API calls, not merely disabled buttons.
- Board/detail/raw API all enforce stage requirements, outcome notes and owner restrictions.
- Concurrent conflicting updates return 409 and preserve the first successful state.
- Unsafe origins and over-limit bodies rejected; service keys absent from client bundles and responses.
- Auth expiration, refresh, logout, inaccessible database and interrupted requests show errors without demo fallback or false success.
- Data survives process restart/redeployment. Backup and restore procedure rehearsed on disposable data.

Configure login abuse controls/rate limits, monitoring, regular database backups, recovery, HTTPS and firewall rules before public use. This increment has body limits and auth checks but does not implement a distributed application rate limiter, MFA flow or monitoring service. Privacy/legal operational review remains a launch responsibility.

## 7. Capacity and limitations

Per-document content is limited to 350,000 UTF-8 bytes; saved prior versions are capped at 40. Commands are limited to 512,000 bytes. Organization state is limited to 8,000,000 bytes. Browser quota may be smaller in demo mode; quota errors prevent the save instead of reporting success.

Before larger deployments, normalize per-record tables, add database migrations and transactional revision/audit storage, support narrower queries, and replace whole-snapshot refresh with pagination/subscriptions where needed. Keep export/backup retention aligned with real business requirements.

No live Twilio, email provider, external calendar, payment gateway, file-upload bucket, agent runner or public lead API is activated. Adding credentials does not turn manual logs into those integrations.
