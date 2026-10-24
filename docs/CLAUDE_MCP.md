# Claude + LayeredFX (MCP)

LayeredFX runs its own MCP server so Claude can work the business: find and enrich leads, keep contacts current,
open and advance pipeline opportunities, and read jobs. Google services connect to Claude directly, alongside it.
Claude combines them in one conversation or in a scheduled routine.

```
Claude (claude.ai · Desktop · mobile · Claude Code · scheduled routines)
 ├─ LayeredFX MCP  https://layeredfx.com/api/mcp     ← this repo (OAuth, your LFX login)
 ├─ Gmail · Google Drive · Calendar · Sheets · Docs   ← Claude's built-in Google connectors
 ├─ Google Maps    https://mapstools.googleapis.com/mcp   ← Google-hosted (Maps Grounding Lite)
 └─ Other Google Cloud MCP servers (BigQuery, …)      ← Google-hosted, enabled per Cloud project
```

## 1. Go live (one time)

1. Apply `supabase/migrations/20261023_layeredfx_mcp_oauth.sql` to the **LayeredFX** Supabase project (done 2026-10-23).
2. Deploy. `NEXT_PUBLIC_SITE_URL` must be the public address (`https://layeredfx.com`); it is the OAuth issuer.
3. Optional: `LFX_XAI_API_KEY` enables AI extraction for `find_leads` and `enrich_contact`.

Nothing else is configured: Claude registers itself (dynamic client registration) the first time you connect.

## 2. Connect Claude to LayeredFX

**claude.ai / Desktop / mobile** — Settings → Connectors → *Add custom connector* → URL
`https://layeredfx.com/api/mcp`. Claude opens the LayeredFX consent screen; sign in with your team account and
choose **Allow access**. The connector then works in every Claude app and in scheduled routines.

**Claude Code** — `claude mcp add --transport http layeredfx https://layeredfx.com/api/mcp`, then `/mcp` to sign in.

Each connection acts as the member who approved it, with that member's current role: viewers get read-only tools.
Disconnect any time under **Profile → Connected apps** (this revokes every token immediately). Removing someone
from the team ends their connections at the next token refresh (within an hour).

### Tools

| Read | Change (staff/admin) | Web (staff/admin) |
|---|---|---|
| `get_overview` · `search_contacts` · `get_contact` · `list_opportunities` · `get_opportunity` · `list_pipeline_stages` · `list_jobs` | `save_contact` · `log_contact_activity` · `add_to_pipeline` · `move_opportunity_stage` · `set_next_step` · `log_opportunity_activity` · `import_leads` | `find_leads` · `enrich_contact` |

Every change is one engine command (`applyCommand`) with the revision check, so stage rules, required steps,
duplicate detection and audit history apply exactly as in the dashboard. A refused stage move returns the missing
steps; there is no admin override over MCP. **No tool sends email, SMS or calls** — Claude prepares customer
messages as Gmail drafts for a person to send, and logs what happened with the activity tools.

## 3. Google services

| Service | How it connects | Notes |
|---|---|---|
| Gmail, Drive, Calendar, Sheets, Docs | Claude's built-in Google connectors (Settings → Connectors). Already connected on this account. | Ask Claude to create Gmail **drafts**, not send, to match the LayeredFX policy. |
| Google Maps | Google Cloud Console → enable **Maps Grounding Lite API** (`mapstools.googleapis.com`) on a billed project. **Claude Code:** `claude mcp add --transport http google-maps https://mapstools.googleapis.com/mcp --header "X-Goog-Api-Key: YOUR_KEY"` (restrict the key to that API). **claude.ai:** add a custom connector with that URL and an OAuth client from the same project (scope `https://www.googleapis.com/auth/maps-platform.mapstools`). | Tools: `search_places`, `compute_routes`, `lookup_weather`, `resolve_names`, `resolve_maps_urls`. Google's terms apply to Maps content. |
| Other Google Cloud MCP servers | Enable the service's MCP endpoint in the Cloud project, then add it as a custom connector the same way. | Only add servers the business needs; each one acts with the Google account you sign in with. |
| Google Slides | No Google-hosted MCP server yet. | Options: build decks from Docs/Sheets content, or self-host a community Workspace MCP server later. |

## 4. Automations (Claude scheduled routines)

Create these with `/schedule` in Claude Code or **Routines** in claude.ai, with the LayeredFX, Gmail, Calendar,
Sheets and Maps connectors enabled. Each prompt keeps customer contact as drafts.

- **Weekday 7:00 — morning brief.** “Call `get_overview` and `list_opportunities attention=true`. For each, suggest
  the next step and set it with `set_next_step`. Check today's Calendar. Email me a summary as a Gmail draft.”
- **Monday 8:00 — lead run.** “Run `find_leads` on the directory pages in the *Lead sources* Sheet, `import_leads`
  the new ones tagged with the source, then `enrich_contact apply=fill_blanks` each. Append what was added to the
  *Lead log* Sheet.”
- **Daily 16:00 — follow-ups.** “For leads added in the last 7 days with no activity, draft a short personalised
  intro in Gmail (drafts only), then `log_contact_activity kind=note` that a draft is waiting for review.”
- **On request — site visit planning.** “For opportunities in Site Visit / Scope, use Maps `compute_routes` from
  the shop to each address, propose an efficient order, and create tentative Calendar holds.”

Start with the morning brief, review its output for a week, then add the others.

## Security model

- OAuth 2.1 authorization code + PKCE (S256) only; public clients; redirects limited to Claude's hosts and local
  loopback (`LFX_MCP_REDIRECT_HOSTS` adds hosts). Consent requires a signed-in active member and cannot be framed.
- Access tokens last one hour; refresh tokens 30 days and rotate. A reused refresh token or authorization code
  revokes the whole connection. Only SHA-256 hashes of secrets are stored.
- Page reads keep the Lead Finder protections: public addresses only (checked at DNS connect time), robots.txt,
  size/time/redirect limits, 60 pages a minute per member. MCP calls are limited to 120 a minute per member.
- Local development (`LFX_OPERATIONS_MODE=demo`) keeps OAuth records and a separate demo copy of the data in
  memory; it resets when the dev server restarts.
