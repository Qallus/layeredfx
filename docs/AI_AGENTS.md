# AI agents setup

LayeredFX plans three agent services, each hosted as its own Coolify app:

| Agent | Service | Address |
|---|---|---|
| Eve (main agent) | Hermes Agent by Nous Research, using OpenAI models | https://agent.layeredfx.com |
| Agent teams | Paperclip | https://team.layeredfx.com |
| Voice agent | xAI Voice Agent API | Hosted by xAI, no subdomain |

**Dashboard › Agents** holds each agent's setup, channels, skills, training documents and assignments. Everything is saved through the operations engine, the same way as all other dashboard data.

**Current status:**
- **Working once the keys are set:** sending an assignment to Eve or to a Paperclip agent team from Dashboard › Agents, and testing each connection from the Setup tab.
- **Not connected:** the xAI voice agent, and anything inbound — agents cannot start work on their own or reply into LayeredFX.
- Nothing reaches a customer unless a person sends it. Skills stay limited to drafts or approval.
- **Setup** never shows a variable's value; a test only reports whether the service answered.

## 1. LayeredFX app (Coolify › LayeredFX › Environment Variables)

All of these stay on the server. Never give them a `NEXT_PUBLIC_` prefix.

```
LFX_HERMES_URL=https://agent.layeredfx.com
LFX_HERMES_API_KEY=
LFX_HERMES_MODEL=eve
LFX_PAPERCLIP_URL=https://team.layeredfx.com
LFX_PAPERCLIP_API_KEY=
LFX_PAPERCLIP_COMPANY_ID=
LFX_PAPERCLIP_AGENT_ID=
LFX_XAI_API_KEY=
LFX_XAI_VOICE_MODEL=grok-voice-latest
LFX_XAI_VOICE=eve
```

- **`LFX_HERMES_API_KEY`:** the same value as `API_SERVER_KEY` in the Hermes app.
- **`LFX_HERMES_MODEL`:** Eve's Hermes **profile name**. Hermes reports profile names as model names, so this is `eve`, not `hermes-agent`.
- **`LFX_PAPERCLIP_API_KEY`:** a Paperclip agent API key. Create it in Paperclip while signed in as an operator.
- **`LFX_PAPERCLIP_AGENT_ID`:** optional. It's the default Paperclip agent for new tasks.
- **`LFX_XAI_VOICE`:** one of the voices listed in the xAI docs, for example `eve`, `ara`, `leo`, `rex` or `sal`.

Redeploy after changing variables.

## 2. Hermes Agent app (agent.layeredfx.com)

- **Image:** `nousresearch/hermes-agent:latest`
- **Start command:** `gateway run`
- **Host:** the Coolify VPS at **31.97.12.201**. The `agent` and `team` A records already point there.
- **Persistent volume:** `/opt/data` (`HERMES_HOME`) — config, profiles, sessions, skills and memory. Never point two containers at the same data directory.
- **Domain:** route `agent.layeredfx.com` to port **8642**, the OpenAI-compatible API.
- **Dashboard:** keep it (port 9119) off, or behind its basic-auth login.

```
OPENAI_API_KEY=
API_SERVER_ENABLED=true
API_SERVER_KEY=
API_SERVER_HOST=0.0.0.0
API_SERVER_PORT=8642
HERMES_DASHBOARD_BASIC_AUTH_USERNAME=
HERMES_DASHBOARD_BASIC_AUTH_PASSWORD=
GATEWAY_ALLOW_ALL_USERS=false
```

Hermes picks its model in `/opt/data/config.yaml`:

```yaml
model:
  provider: openai-api
  default: YOUR_OPENAI_MODEL
```

**Calling the API:** send `Authorization: Bearer <API_SERVER_KEY>`.
- Chat: `POST /v1/chat/completions` and `POST /v1/responses`
- Health check: `GET /health`

To first create `config.yaml`, run `setup` once in the container with the volume attached.

**Give Eve her own profile.** A profile is a separate Hermes home (`/opt/data/profiles/eve/`) with its own `config.yaml`, `.env`, `SOUL.md` persona, memory, sessions and skills — that is what makes her Eve rather than a generic assistant. Set the model inside that profile. Because Hermes advertises the profile name as the model name, LayeredFX sends `"model":"eve"`.

**Verify before moving on:**
```
curl https://agent.layeredfx.com/health
curl -H "Authorization: Bearer $API_SERVER_KEY" https://agent.layeredfx.com/v1/models
curl -H "Authorization: Bearer $API_SERVER_KEY" -H "Content-Type: application/json" \
  -d '{"model":"eve","messages":[{"role":"user","content":"Reply with OK"}]}' \
  https://agent.layeredfx.com/v1/chat/completions
```

**Messaging channels:** Hermes can also connect to Telegram, Slack, SMS, email and other channels through its own gateway variables. Leave those off until you decide which channels Eve should use, and use LayeredFX's own Twilio and email accounts, never Channel Cast's.

## 3. Paperclip app (team.layeredfx.com)

- **Build:** from https://github.com/paperclipai/paperclip. I found no official pre-built image.
- **Domain:** route `team.layeredfx.com` to port **3100**.
- **Storage:** give `PAPERCLIP_HOME` a persistent volume — it holds the database, secrets and artifacts. Prefer a separate Coolify Postgres through `DATABASE_URL` so backups and upgrades are independent of the app container.
- **Requirements:** Node 24.11+, at least 1 vCPU and 2 GB RAM.
- **First run:** the owner account is claimed through a **one-time URL printed in the container logs**. Open the app's logs in Coolify right after the first boot, use that link, then create the LayeredFX company, an agent, and the agent API key.

```
PAPERCLIP_PUBLIC_URL=https://team.layeredfx.com
PAPERCLIP_DEPLOYMENT_MODE=authenticated
PAPERCLIP_DEPLOYMENT_EXPOSURE=public
PAPERCLIP_ALLOWED_HOSTNAMES=team.layeredfx.com
HOST=0.0.0.0
BETTER_AUTH_SECRET=
PAPERCLIP_TOOL_ACTION_SIGNING_SECRET=
DATABASE_URL=
OPENAI_API_KEY=
PAPERCLIP_TELEMETRY_DISABLED=1
```

**API:** the base is `https://team.layeredfx.com/api`, with `Authorization: Bearer <agent API key>`.
- Tasks are issues: `POST /api/companies/{companyId}/issues`, with `title`, `description` and `assigneeAgentId`.

**Known issue:** creating an issue can return HTTP 500 even when the issue was saved. The LayeredFX connection must check whether it exists before retrying.

**Hermes inside Paperclip:** Paperclip's built-in `hermes_local` adapter runs the Hermes command line on the same server. Because Hermes and Paperclip run as separate Coolify apps, connect them through their HTTP APIs instead.

## 4. xAI Voice Agent API

- **Endpoint:** `wss://api.x.ai/v1/realtime?model=grok-voice-latest`
- **Auth:** `Authorization: Bearer <XAI_API_KEY>`. Keep the key on the server.
- **Browser voice:** the server requests a short-lived token from `POST https://api.x.ai/v1/realtime/client_secrets`.
- **Phone calls:** use an xAI SIP number, for example through a Twilio Elastic SIP trunk pointing at `sip:{number}@sip.voice.x.ai;transport=tls`.
- **Pricing:** xAI lists speech-to-speech at $0.08 per minute. Check the current price before going live.

## 5. Security checklist

- Generate long random values for `API_SERVER_KEY`, `BETTER_AUTH_SECRET` and `PAPERCLIP_TOOL_ACTION_SIGNING_SECRET`.
- Never reuse Channel Cast or ControlP keys, accounts or databases.
- Agent skills can only prepare drafts or wait for approval. Anything a customer would see needs a person to approve it.
- Don't put passwords, API keys or customer payment details in training documents.

## Sources

- Hermes Agent: https://github.com/NousResearch/hermes-agent and https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
- Paperclip: https://github.com/paperclipai/paperclip and https://docs.paperclip.ing/reference/adapters/hermes/
- xAI Voice: https://docs.x.ai/docs/guides/voice/agent
