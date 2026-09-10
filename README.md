# LayeredFX — Website and Operations Studio

The existing LayeredFX homepage plus three Channel Cast-derived modules: **Pipeline**, **Workspace**, and **Plans**. Project-root source for VS Code, Next.js / React / TypeScript, namespaced shadcn/ui, Three.js and a Plate rich-text editor.

Start with **START_HERE.md**.

```bash
npm install
npm run dev
```

The website is `/`; operations starts at `/admin`. Development uses local synthetic records. Authenticated production uses a separate LayeredFX Supabase project and the supplied server API. No production credentials are bundled.

## What is where

| Path | Responsibility |
|---|---|
| `components/layeredfx/` | Existing public homepage and shadcn/ui primitives. |
| `lib/layeredfx/` | Existing content, validators and Three.js scene. |
| `app/admin/(operations)/` | Protected dashboard routes and detail pages. |
| `components/operations/` | Shell, Pipeline, Workspace, Plans, editor and state provider. |
| `lib/operations/engine.mjs` | Shared business rules; identical reducer for local demo and live API. |
| `lib/operations/defaults.mjs` | Stable source stages, LayeredFX guidance, document/plan templates. |
| `lib/operations/server.ts` | Auth, active membership, server-only Supabase access and revision locking. |
| `app/api/operations/` | Validated command/read API, login, refresh and logout. |
| `supabase/` | Unapplied schema and manual membership bootstrap example. |
| `tests/operations*.test.mjs` | Stage, access, data-integrity and request-boundary tests. |
| `docs/channel-cast/` | Source audit, parity, setup, merge map and QA. |

Plans here means **task/project planning**, not subscription pricing. The Channel Cast source's stable stage keys are retained; display labels and guidance are adapted to installation services. Private documents/plans are filtered before live API responses. Local demonstration is not secure storage for real business records.

## Verification

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` after installing dependencies. See `docs/channel-cast/QA_REPORT.md` for checks actually executed and checks still outstanding. The delivered source is not a production certification or a complete migration of either source application.

The architecture avoids bringing over Channel Cast's device, advertising, billing, AI and communications providers. The public homepage estimate is not connected to live lead intake in this package. No network action is represented as success when no provider has run.
