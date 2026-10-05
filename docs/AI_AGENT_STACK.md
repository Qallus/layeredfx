# AI agent stack: Hermes, Paperclip and xAI Voice

A portable setup guide for running three agent services behind your own domain on a Coolify-managed VPS, and connecting them to an app.

**How to use this file:** copy it into the new project, fill in the table below, then work top to bottom. Every command and variable block uses those placeholders.

| Placeholder | Meaning | Example |
|---|---|---|
| `<DOMAIN>` | The project's root domain | `example.com` |
| `<AGENT_HOST>` | Subdomain for Hermes | `agent.example.com` |
| `<TEAM_HOST>` | Subdomain for Paperclip | `team.example.com` |
| `<VPS_IP>` | Coolify server IPv4 | `203.0.113.10` |
| `<PREFIX>` | Env var prefix for your app | `APP`, `LFX`, `ACME` |
| `<AGENT_NAME>` | Your main agent's name/profile | `eve`, `atlas` |

Anything marked **unconfirmed** could not be verified in official documentation. Check it against the repo before relying on it.

---

## 1. What each service is for

| Service | Role | Runs where | Cost model |
|---|---|---|---|
| **Hermes Agent** (Nous Research) | One persistent assistant with memory, skills and a persona. Your "main agent". | Your VPS, Docker | Your LLM provider key |
| **Paperclip** | Teams of agents working tasks (issues) inside companies. Delegation and longer jobs. | Your VPS, Docker + Postgres | Your LLM provider key |
| **xAI Voice Agent API** | Real-time speech-to-speech; phone calls over SIP. | Hosted by xAI | Per minute, billed by xAI |

**A sensible division of labour:** the main agent handles conversation and short drafts; Paperclip handles work that needs several steps or several agents; the voice agent handles calls. Your app is the system of record and the approval gate.

---

## 2. Prerequisites

- **Server:** 8 GB RAM minimum, 16 GB comfortable, for all three plus your app and Coolify. Hermes wants 2–4 GB and 2 cores; Paperclip wants 1 vCPU and 2 GB; Postgres and Coolify/Traefik take the rest.
- **DNS:** two A records before you create the apps, so certificates issue on the first try.
  ```
  agent   A   <VPS_IP>
  team    A   <VPS_IP>
  ```
- **Keys:** an LLM provider key with billing enabled (OpenAI, Anthropic, or OpenRouter), and `XAI_API_KEY` if you want voice.
- **Secrets:** generate each one separately, never reuse across projects.
  ```bash
  openssl rand -hex 32
  ```

---

## 3. Hermes Agent → `<AGENT_HOST>`

**Docs:** <https://github.com/NousResearch/hermes-agent> · <https://hermes-agent.nousresearch.com/docs/>

### Deploy

| Setting | Value |
|---|---|
| Image | `nousresearch/hermes-agent:latest` |
| Command | `gateway run` |
| Persistent volume | `/opt/data` (this is `HERMES_HOME`) |
| Domain → port | `<AGENT_HOST>` → **8642** (OpenAI-compatible API) |
| Dashboard port | **9119** — leave unexposed, or protect it with basic auth |
| File ownership | `HERMES_UID` / `HERMES_GID` (default 10000) |

Two rules that cause real damage if ignored:

- **Never point two containers at the same data directory.** One container, one `/opt/data`.
- **Without the volume, the agent forgets everything on redeploy** — sessions, memory, skills, persona.

### Environment

```
OPENAI_API_KEY=
API_SERVER_ENABLED=true
API_SERVER_KEY=
API_SERVER_HOST=0.0.0.0
API_SERVER_PORT=8642
GATEWAY_ALLOW_ALL_USERS=false
```

`API_SERVER_HOST=0.0.0.0` is required — the server binds to `127.0.0.1` by default and the domain will never reach it. Optional: `OPENAI_BASE_URL` for a different endpoint, `HERMES_DASHBOARD_BASIC_AUTH_USERNAME` / `_PASSWORD` if you expose the dashboard, `WEBHOOK_ENABLED` / `WEBHOOK_PORT` / `WEBHOOK_SECRET` for inbound webhooks (HMAC signed; **webhook paths unconfirmed**).

### First run and the model

Run `setup` once in the container with the volume attached to create `config.yaml`. The **model is chosen in YAML, not an environment variable**:

```yaml
model:
  provider: openai-api
  default: <your model id>
```

`HERMES_MODEL` and `HERMES_INFERENCE_MODEL` override it process-wide, but the docs prefer the YAML. YAML can read env vars with `${VAR}`.

### Profiles — give the agent an identity

A **profile** is a separate Hermes home at `/opt/data/profiles/<AGENT_NAME>/`, with its own `config.yaml`, `.env`, `SOUL.md` (persona), memory, sessions, skills and cron jobs. Use one; do not run your agent as the nameless default.

**This matters for integration:** `/v1/models` advertises **profile names as model names**. An app calling Hermes sends `"model": "<AGENT_NAME>"`, not `hermes-agent`.

Three ways to select a profile:

1. **Own port/process:** `hermes -p <name> gateway` on another port, with its own `API_SERVER_KEY`.
2. **Model name:** pass the profile as `model` on a normal request. *(Simplest — use this.)*
3. **Multiplexed:** set `gateway.multiplex_profiles: true`, then call `POST /p/<profile>/v1/chat/completions`. Each prefix needs that profile's own key.

### API

Auth: `Authorization: Bearer <API_SERVER_KEY>`

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness |
| `GET /v1/models` | Lists profiles as models |
| `POST /v1/chat/completions` | OpenAI-compatible chat |
| `POST /v1/responses` | Responses-style call |
| `POST /v1/runs` | Agent run |
| `POST /api/sessions/{id}/chat` | Continue a session |

### Messaging channels (optional)

Hermes can connect directly to chat platforms through its gateway. Leave these off until you have decided which channels the agent should answer on, and always keep `GATEWAY_ALLOW_ALL_USERS=false` with an explicit allow-list.

| Channel | Variables |
|---|---|
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USERS`, `TELEGRAM_HOME_CHANNEL`, `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET` |
| Discord | `DISCORD_BOT_TOKEN`, `DISCORD_ALLOWED_USERS`, `DISCORD_ALLOWED_ROLES`, `DISCORD_ALLOWED_CHANNELS`, `DISCORD_HOME_CHANNEL` |
| Slack | `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `SLACK_ALLOWED_USERS` |
| WhatsApp | `WHATSAPP_ENABLED`, `WHATSAPP_ALLOWED_USERS`, `WHATSAPP_CLOUD_PHONE_NUMBER_ID` |
| SMS (Twilio) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_WEBHOOK_URL`, `SMS_ALLOWED_USERS` |
| Signal | `SIGNAL_HTTP_URL`, `SIGNAL_ACCOUNT`, `SIGNAL_ALLOWED_USERS` |
| Email | `EMAIL_ADDRESS`, `EMAIL_PASSWORD`, `EMAIL_IMAP_HOST`, `EMAIL_IMAP_PORT`, `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_ALLOWED_USERS` |
| All | `GATEWAY_ALLOWED_USERS`, `GATEWAY_ALLOW_ALL_USERS` |

Teams and Google Chat are also supported (`TEAMS_*`, `GOOGLE_CHAT_*`).

### Verify

```bash
curl https://<AGENT_HOST>/health
curl -H "Authorization: Bearer $API_SERVER_KEY" https://<AGENT_HOST>/v1/models
curl -H "Authorization: Bearer $API_SERVER_KEY" -H "Content-Type: application/json" \
  -d '{"model":"<AGENT_NAME>","messages":[{"role":"user","content":"Reply with OK"}]}' \
  https://<AGENT_HOST>/v1/chat/completions
```

---

## 4. Paperclip → `<TEAM_HOST>`

**Docs:** <https://github.com/paperclipai/paperclip> · <https://docs.paperclip.ing/>

### Deploy

| Setting | Value |
|---|---|
| Source | Build from the Git repo — no official prebuilt image (**unconfirmed** whether one now exists) |
| Domain → port | `<TEAM_HOST>` → **3100** (`PAPERCLIP_PORT` to change) |
| Persistent volume | `PAPERCLIP_HOME` — database, secrets and artifacts |
| Requirements | Node 24.11+, 1 vCPU, 2 GB RAM |
| Database | Embedded by default; prefer a separate Postgres via `DATABASE_URL` |

The repo ships `docker/docker-compose.quickstart.yml` (single container) and `docker/docker-compose.yml` (adds Postgres 17).

### Environment

```
PAPERCLIP_PUBLIC_URL=https://<TEAM_HOST>
PAPERCLIP_DEPLOYMENT_MODE=authenticated
PAPERCLIP_DEPLOYMENT_EXPOSURE=public
PAPERCLIP_ALLOWED_HOSTNAMES=<TEAM_HOST>
HOST=0.0.0.0
BETTER_AUTH_SECRET=
PAPERCLIP_TOOL_ACTION_SIGNING_SECRET=
DATABASE_URL=
OPENAI_API_KEY=
PAPERCLIP_TELEMETRY_DISABLED=1
```

Also supported: `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `DO_NOT_TRACK=1`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `SENTRY_DSN_FRONTEND`, `SENTRY_DSN_BACKEND`.

### First run — the step people miss

**The first owner account is claimed through a one-time URL printed in the container logs.** Open the app's logs in Coolify immediately after the first boot and use that link. Then:

1. Create the company.
2. Create an agent.
3. Create the agent's **API key** (keys are bound to their issuing company).
4. Note the **company id** — your app needs it.

Roles are Owner / Admin / Operator / Viewer. Invites live at Settings → Members; cross-company access at Settings → Instance: Access.

### API

Base `https://<TEAM_HOST>/api`, auth `Authorization: Bearer <agent API key>`.

| Call | Purpose |
|---|---|
| `POST /api/companies/{companyId}/issues` | Create a task |
| `GET /api/companies/{companyId}/issues` | List tasks |
| `GET /api/companies/{companyId}/agents` | List agents (good health check) |
| `PATCH /api/issues/{id}` | Update a task |
| `GET /api/issues/{id}/comments` | Read comments |

Issue fields: `title`, `description`, `assigneeAgentId`, `projectId`, `parentId`, `status` (`backlog` `todo` `in_progress` `in_review` `done` `blocked` `cancelled`), `priority` (`critical` `high` `medium` `low`).

During a run, Paperclip gives agents `PAPERCLIP_API_URL`, `PAPERCLIP_API_KEY`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_AGENT_ID`, `PAPERCLIP_RUN_ID`.

> ### ⚠ Known bug: creating an issue can return HTTP 500 after saving
> Reported as issue #3310. **Never auto-retry a failed create** — you will duplicate the task. See the duplicate-safe pattern in section 6.

### Multi-company

One Paperclip instance serves many companies with separate data, agents, tasks and keys — so one deployment can cover several projects or clients. Per-company model keys are possible through **provider vaults** (Company Settings → Secrets); otherwise the instance-level key is used. Isolation is logical, not hostile-tenant hardened, so put untrusted clients on their own instance.

### Paperclip + Hermes together

Paperclip's built-in `hermes_local` adapter runs the Hermes **CLI on the same machine**. If Hermes and Paperclip are separate apps (the normal Coolify setup), that adapter will not work — connect them over their HTTP APIs instead. The adapter also has a known bug where it does not pass `PAPERCLIP_API_KEY` through (adapter issue #57).

---

## 5. xAI: Grok chat and Voice

### Grok chat (no deployment needed)

xAI's hosted API is OpenAI-compatible, so a Grok agent is just a second chat client in your app — no container, no volume.

- **Endpoint:** `POST https://api.x.ai/v1/chat/completions`
- **Auth:** `Authorization: Bearer $XAI_API_KEY`
- **Body:** `{"model": "<model id>", "messages": [...], "stream": false}`; reply at `choices[0].message.content`, id at the root `id`.
- **Models:** check <https://docs.x.ai/developers/models> — ids change often. At the time of writing `grok-4.7` is the general recommendation.
- **Health check:** `GET /v1/models`.

### Voice

**Docs:** <https://docs.x.ai/docs/guides/voice/agent>

- **Endpoint:** `wss://api.x.ai/v1/realtime?model=grok-voice-latest` — closely follows OpenAI's Realtime API, with some event names differing.
- **Auth:** `Authorization: Bearer $XAI_API_KEY`. Server-side only.
- **Models:** `grok-voice-latest`, `grok-voice-think-fast-2.0`.
- **Voices** (set via `session.update` → `voice`): eve, ara, leo, rex, sal, carina, zagan, helix, orion, luna, iris, altair, zenith, perseus, helios, lux, kepler, rigel, cosmo, celeste, ursa, sirius, lumen, castor, naksh, atlas, or a custom voice id.
- **Audio:** `audio/pcm` (24 kHz default), `audio/pcmu`, `audio/pcma`, `audio/opus`.
- **Tools:** `web_search`, `x_search`, `file_search`, MCP, and your own functions.

### Browser voice

Your server mints a short-lived token — never ship the API key to the browser:

```
POST https://api.x.ai/v1/realtime/client_secrets
Authorization: Bearer $XAI_API_KEY
{"expires_after":{"seconds":300}}        # max 3600
```

The browser then connects with the subprotocol `xai-client-secret.<token>`. *(Token response field names **unconfirmed**.)*

### Phone calls

Create an xAI SIP number with a webhook. xAI sends a signed `realtime.call.incoming` event carrying a `call_id`; your server opens the WebSocket for that call. Browser tokens do **not** work for phone calls — use the API key.

- **Twilio:** Elastic SIP Trunk with origination URI `sip:{number}@sip.voice.x.ai;transport=tls`.
- **Transfer:** `POST /v1/realtime/calls/{call_id}/refer` with `target_uri`. **Hang up:** `POST /v1/realtime/calls/{call_id}/hangup`.
- Twilio Media Streams integration is not documented (**unconfirmed**).

### Pricing (verify before launch)

Speech-to-speech $0.08/min ($4.80/hr) · speech-to-text $0.10/hr REST, $0.20/hr streaming · text-to-speech $15 per 1M characters · SIP not listed.

---

## 6. Connecting your app

### Environment block

Put these in the **app**, server-side only. Never prefix with `NEXT_PUBLIC_` or any client-exposed prefix, and in Coolify leave "Build Variable" unticked so values are not baked into image layers.

```
<PREFIX>_HERMES_URL=https://<AGENT_HOST>
<PREFIX>_HERMES_API_KEY=
<PREFIX>_HERMES_MODEL=<AGENT_NAME>
<PREFIX>_PAPERCLIP_URL=https://<TEAM_HOST>
<PREFIX>_PAPERCLIP_API_KEY=
<PREFIX>_PAPERCLIP_COMPANY_ID=
<PREFIX>_PAPERCLIP_AGENT_ID=
<PREFIX>_XAI_API_KEY=
<PREFIX>_XAI_MODEL=
<PREFIX>_XAI_VOICE_MODEL=grok-voice-latest
<PREFIX>_XAI_VOICE=
```

`<PREFIX>_HERMES_API_KEY` is the same value as `API_SERVER_KEY` in the Hermes app. `<PREFIX>_HERMES_MODEL` is the **profile name**.

### Client rules that avoid the common failures

1. **Timeouts on everything.** ~20s for a chat call, ~15s for a task create, ~8s for a health check (`AbortSignal.timeout`).
2. **Never return the provider's error body** to your client — it can echo request details back. Keep the status code, drop the body.
3. **Unconfigured is 503, provider failure is 502**, with a message that says what did *not* happen: "X did not confirm the request. Check before sending again."
4. **Duplicate-safe task creation** for the Paperclip 500 bug:

   ```
   marker = "<app>:<recordId>:<attempt>"      # appended to the description
   POST the issue
   on any failure (500 or network):
     GET /api/companies/{id}/issues?limit=50
     scan title + description for the marker
     found     → it saved; return it as unconfirmed
     not found → raise an error. Never re-POST.
   ```
5. **Health check that proves authorization**, not just reachability: Hermes `GET /health` *and* `GET /v1/models` (confirm your profile appears); Paperclip `GET /api/companies/{id}/agents` (proves the key can read that company).
6. **Throttle per user** (e.g. 10 actions/minute) so a stuck UI cannot hammer a paid API.
7. **Record the outcome on the record**, including the external id and a failure reason, and keep failed work re-sendable rather than silently "done".
8. **Local/demo environments must refuse to call the provider at all** — no keys, no requests.

### Suggested request shape

```
Hermes   POST /v1/chat/completions
         { "model": "<AGENT_NAME>", "stream": false,
           "messages": [ {"role":"system", ...}, {"role":"user", ...} ] }
         reply: choices[0].message.content

Paperclip POST /api/companies/{companyId}/issues
         { "title": ..., "description": ...,
           "status": "todo", "priority": "medium",
           "assigneeAgentId": "<PREFIX>_PAPERCLIP_AGENT_ID" }
```

---

## 7. Running several projects on one server

| Component | Share it | Give each project its own |
|---|---|---|
| Paperclip | One instance, a **company per project** | A separate instance only for untrusted clients or separate uptime/backup needs |
| Hermes | One container, one `/opt/data`, a **profile per project** | Profile directory, `.env`, `SOUL.md`, memory, skills, API key. Second container only for hard isolation — never a shared volume |
| Postgres | One Coolify Postgres, reached by internal URL | A separate database and credentials per Paperclip instance |
| Domains | One wildcard record + wildcard certificate | One subdomain per project |
| Coolify | One server, one proxy | One **project** per client; "Clone Resource" copies settings but **not volume data or databases** |

---

## 8. Deployment order

1. DNS records first, then wait for them to resolve.
2. Hermes → verify `/health` and `/v1/models`.
3. Postgres → then Paperclip → claim the owner account from the logs → company, agent, API key.
4. App environment variables → redeploy.
5. Test both connections from the app, then send one real task to each.

## 9. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Domain does not respond at all | App not deployed, or certificate not issued because DNS was added after the app |
| Connection refused inside the server | `API_SERVER_HOST` not `0.0.0.0`, or the wrong port mapped |
| HTTP 401 from Hermes | `API_SERVER_KEY` mismatch between the two apps |
| Model not found | Sending `hermes-agent` instead of the profile name |
| Agent forgets everything after deploy | No persistent volume on `/opt/data` |
| Cannot sign in to Paperclip | Missed the one-time claim URL in the logs |
| HTTP 401/404 from Paperclip | Agent key belongs to another company, or wrong company id |
| Duplicate Paperclip tasks | Retrying a create that returned 500 after saving |
| Keys visible in the built image | "Build Variable" ticked in Coolify |

## 10. Security checklist

- [ ] Every secret generated fresh; nothing reused between projects or copied from another product.
- [ ] All keys server-side only; nothing in client bundles, logs or JSON responses.
- [ ] Hermes dashboard closed or behind basic auth; `GATEWAY_ALLOW_ALL_USERS=false`.
- [ ] Paperclip in `authenticated` mode with `PAPERCLIP_ALLOWED_HOSTNAMES` set.
- [ ] Agent actions gated by role in your app, and rate limited.
- [ ] Customer-facing output reviewed by a person before it is sent.
- [ ] Persistent volumes and database backups configured before real work starts.

## Sources

- Hermes Agent: <https://github.com/NousResearch/hermes-agent> · <https://hermes-agent.nousresearch.com/docs/>
- Paperclip: <https://github.com/paperclipai/paperclip> · <https://docs.paperclip.ing/>
- xAI Voice: <https://docs.x.ai/docs/guides/voice/agent>
- Coolify: <https://coolify.io/docs>
