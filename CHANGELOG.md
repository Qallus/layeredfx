# Change log

## Unreleased

Added Lead Finder (`/admin/lead-finder`, under Pipeline). Staff paste up to 25 public page addresses; the server reads each page (public addresses only, checked at DNS connect time; robots.txt honoured; 2 MB / 15 s / 4-redirect limits) and returns contact drafts, using Grok when `LFX_XAI_API_KEY` is set or schema.org data and email/phone links otherwise. Nothing is saved until selected rows are imported through `contact.import`, with the existing duplicate checks. No crawling, scheduling, email verification or enrichment providers are included.

Added contact enrichment: an **Enrich** action on Contacts/Leads (bulk selection and the contact detail view). For up to 25 contacts at a time it reads each contact's website — or the domain of a business email — plus up to three same-site contact/about/team pages, under the same Lead Finder limits. Proposed values are reviewed field by field: blank fields are pre-ticked, replacements of existing values are offered unticked. Ticked fields are saved through `contact.save`; optional website findings (about text, services, social profiles, people named) are kept in the contact's details and shown in the contact view, and each save is logged as a contact activity. No third-party enrichment database is used.

Added the LayeredFX MCP server (`/api/mcp`) so Claude apps and scheduled routines can work the dashboard: 16 tools for the overview, contacts, pipeline, jobs, Lead Finder and enrichment. Every change goes through `applyCommand` with the revision check; there is no tool that sends messages and no stage-rule override. Access is OAuth 2.1 (PKCE, dynamic registration, rotating refresh tokens with replay revocation) approved on a consent screen by a signed-in member, and can be disconnected under Profile → Connected apps. Requires the `20261023_layeredfx_mcp_oauth.sql` migration (applied 2026-10-23). Google services connect to Claude directly; see `docs/CLAUDE_MCP.md`.

## 0.2.0 — 2026-09-10

Added a LayeredFX operations dashboard with Pipeline (including nine source stages and their core workflow rules), Workspace documents and task Plans adapted from reviewed Channel Cast source. Added domain commands, local synthetic demo persistence, a server-authenticated Supabase adapter, unapplied schema, permission/revision validation and operations tests.

The original homepage, artwork, Three.js material studio and namespaced shadcn/ui components remain. Added a footer Team dashboard link and explicit admin indexing exclusions. No live providers, external messages, payments or source company data were imported.

See docs/channel-cast/FEATURE_PARITY.md and QA_REPORT.md for exactly implemented and unverified behavior.
