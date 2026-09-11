# Contacts and quick actions

Source reviewed: `Qallus/Channel-Cast-OS` commit `8cd1de0a6c3aacd2da08b0544a29e9df5a6044cf`, specifically `components/crm/contacts-page.tsx`, `lib/crm/contacts.ts`, `lib/crm/phone-import.ts`, `components/crm/phone-import-modal.tsx`, `components/fab/fab.tsx` and its communication tools. The vCard/Contact Picker parser is adapted under `lib/channelcast`; source seed records were not copied. Screens and commands were adapted to the existing LayeredFX provider instead of creating a separate CRM store.

## Contacts

- `/admin/contacts`: add/edit contacts, categories, tags, status, owners, search, list/table/cards/Kanban/calendar, CSV export, activity, archive and guarded deletion. Bulk actions assign an owner, add to Pipeline, work leads or archive. Calendar uses the recorded last-contact date.
- `/admin/leads`: the Leads category in the same directory. Category changes to Lead create/reuse a linked lead record. Pipeline retains its existing lead inbox.
- Add to Pipeline and Work Lead reuse the same contact ID. Repeated conversion reuses linked lead/opportunity IDs. All opportunity stages still go through the original validated engine; contact categories do not silently advance pipeline stages.
- User linking is administrator-only and selects an **existing active LayeredFX account**. It never creates a login, invites a person, changes a role or promotes an imported contact to administrator.
- Potential customer / Customer are the source Prospect / Client categories. Those records appear in the existing source customer screen; linked members keep their actual user IDs. Plain contacts and unqualified leads are not automatically treated as customers.
- Contact data, activity, private notes and internal DMs persist through the existing operations command API and its revision check. Local demo saves remain browser-only. The existing isolated Supabase operations store supports the additional JSON fields without a new SQL migration; real hosted persistence remains unverified until the user supplies the LayeredFX connection.

## Android import and Select all

Use **From phone** on `/admin/contacts`. The browser Contact Picker asks the Android user which people to share. Its OS-owned selection/permission screen cannot be bypassed by the web app. The app requests multiple selection and only reads selected names, phone numbers and email addresses.

For a full address-book transfer, Android Contacts can export a `.vcf` file. Choose that file in LayeredFX, or choose a Google Contacts CSV. Photos are not imported. Review shows new contacts, matches, conflicting identities and duplicates within the file. **Select all contacts** selects every eligible row in one click; **Deselect all** clears them. Existing matches fill blank fields only when explicitly selected. Conflicting matches and archived records require resolution first.

The importer accepts files up to 2 MB and up to 5,000 reviewed contacts. One Import click saves the selection in batches of at most 200 records / approximately 400 KB each. Each batch is atomic. If a batch fails, previously completed batches remain saved and the unprocessed rows stay selected with a progress/error message; no hidden retry is made. The existing total workspace capacity limit still applies.

Direct phone picking requires a supported browser and a secure top-level page. `localhost` on the development computer is not the same address on a phone. The VCF/CSV path works on the local desktop preview. A browser test mocked the OS picker with 205 synthetic people and verified Select all, two batches and persistence after reload; actual Android hardware has not been tested. See [MDN Contact Picker](https://developer.mozilla.org/en-US/docs/Web/API/Contact_Picker_API).

## Floating action button

The dashboard-wide FAB follows Channel Cast's compact/expanded tab layout. It provides AI Agents access, internal direct messages, SMS, dialpad, outgoing call history, private notes and microphone recordings. Contact Call/Text actions seed the relevant FAB tool.

- **AI Agents:** opens the existing agent workspace. AI execution remains awaiting its provider integration; this increment does not fabricate AI replies.
- **DMs:** real participant-filtered internal messages through the existing operations store. Demo mode labels them as preview messages and sends nothing externally. Delivery is pull/reload based, not realtime; no external customer chat integration is claimed.
- **Notes:** private to their author, with editing/deletion and a per-note revision conflict check in addition to the global state revision. Text drafts remain mounted while switching/closing FAB tools; a full page reload still discards an unsaved draft.
- **Microphone:** explicit Start/Stop, playback, browser-local save, download and delete. Uses MediaRecorder and IndexedDB, stops after three minutes, has a 20 MB save limit and releases microphone tracks. Recordings are not uploaded or used as automatic call recordings. Browser verification used fake microphone audio only.
- **Voice:** outgoing Twilio Voice SDK calls with dialpad/DTMF, mute, hang-up and short-lived tokens. An active call survives closing/switching the FAB. Incoming calls are not implemented. Recordings are not automatically enabled for calls.
- **SMS:** drafts, explicit send, queued-status confirmation and sent-message history. Provider acceptance is distinguished from delivery. Incoming SMS is not implemented.

## Twilio setup (not applied)

Use a separate LayeredFX account and the blank `LFX_TWILIO_*` entries in `.env.example`:

1. Account SID, Auth Token and an E.164 phone number enable SMS and outgoing history.
2. Add API Key SID/secret and a TwiML App SID for browser voice.
3. Set the TwiML App's Voice URL to `https://YOUR-LAYEREDFX-HOST/api/communications/voice` with POST. Set `LFX_TWILIO_VOICE_WEBHOOK_URL` to that exact public URL. Reverse-proxy headers do not select the signature-validation URL.
4. After separately authorized staging setup, verify one permitted call/SMS, microphone permissions, blocked viewers, expired sessions, revoked membership, call history and actual provider statuses.

All browser communication API calls verify Supabase user + active membership; writes check origin and bound the body. SMS caller number is fixed on the server. Tokens have a ten-minute TTL with outgoing-only grants. The provider webhook is the explicit cookie-auth exception: it verifies the Twilio signature, account SID and active non-viewer identity before returning dialing instructions. The rate guard is per process, not a distributed deployment quota. Twilio service secrets never enter browser configuration.

No source credentials were copied, no hosted schema was changed, and no real message or call was sent during implementation. Signed webhook tests use synthetic keys and the real Twilio signature helper; API tests mock provider I/O. See [Twilio Voice SDK](https://www.twilio.com/docs/voice/sdks/javascript) and [Access Tokens](https://www.twilio.com/docs/iam/access-tokens).
