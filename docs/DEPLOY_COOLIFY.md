> Operations added: production `/admin` requires the LayeredFX-only authenticated adapter. Configure runtime `LFX_` variables and follow `docs/channel-cast/SETUP.md`. Do not deploy the local demo as a real CRM. The health check below verifies the app process, not database readiness.

# Coolify preview deployment

A Dockerfile is supplied as a starting point. It was **not built or deployed in this delivery environment**. Verify locally before using it on the VPS.

## Before deployment

Run:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Review and commit `package-lock.json`. Do not copy ControlP's live `.env` file. No backend credentials are needed here.

## Resource configuration

Create a separate Coolify application connected to the new LayeredFX repository. Use the Dockerfile build pack, repository root as the base directory, `Dockerfile` as the Dockerfile path, and application port **3000**.

The runtime binds to `0.0.0.0`. A non-root runtime user and `/api/health` endpoint are included. A health response reports `{ status: "ok", application: "layeredfx-homepage", mode: "preview" }`.

Use a staging subdomain or preview URL before changing the live site. Keep:

```dotenv
ALLOW_INDEXING=false
NEXT_PUBLIC_SITE_URL=https://your-approved-preview-host
```

These values affect the build. Configure them for the build in Coolify and rebuild after changes. The default site URL is `https://layeredfx.com`, so change it to the actual approved preview host for a staging deployment.

## Domain cutover later

After the complete application, content, integrations, and backup plan are approved, configure the desired canonical host and redirect the other host. Verify HTTPS for both `layeredfx.com` and `www.layeredfx.com`.

Confirm the current VPS IP rather than copying an older address from another project. Do not modify MX, SPF, DKIM, or DMARC records while pointing website traffic. Domain/DNS edits and production deployment require separate approval.

The homepage prototype should not replace a working lead-generating live site until the estimate, contact, and booking workflows are real and tested.

## Source

Coolify Dockerfile build pack documentation: https://coolify.io/docs/applications/build-packs/dockerfile
