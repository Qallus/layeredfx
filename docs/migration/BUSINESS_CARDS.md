# Digital business cards — Channel Cast → LayeredFX

Source: Channel Cast OS (`github.com/Qallus/Channel-Cast-OS`, default branch, shallow clone 2026-09-13):
`components/business-cards/*`, `lib/business-cards/*`, `app/api/admin/business-cards/**`, `app/api/cards/**`, `app/card/[slug]/*`, `app/app/admin/business-cards/**`, `app/api/admin/uploads/route.ts`.
Nothing was pushed to or changed in Channel Cast. No Channel Cast data, credentials or users were copied.

## Routes

| Route | Purpose |
|---|---|
| `/admin/business-cards` | Card list (My cards / All cards for admins), stat tiles, status filters, Leads tab, builder, per-card analytics, NFC write dialog |
| `/admin/business-cards/[id]/nfc` | Phone-side NFC write page opened from the QR in the NFC dialog |
| `/card/[slug]` | Public card page (records view / QR scan / NFC tap from `?source=`) |
| `GET/POST/PATCH /api/admin/business-cards` | List + stats; create; full save with revision check |
| `PATCH/DELETE /api/admin/business-cards/[id]` | Status, NFC status, owner; delete (revision required) |
| `GET /api/admin/business-cards/[id]/analytics` | 7/30/90-day analytics |
| `GET /api/admin/business-cards/leads`, `PATCH/DELETE …/leads/[id]` | Lead inbox, status, delete |
| `POST /api/admin/business-cards/uploads` | JPEG/PNG/WebP upload to the `lfx-card-media` bucket (configured environments only) |
| `POST /api/cards/leads`, `POST /api/cards/events` | Public lead capture and interaction tracking |
| `GET /api/cards/qr`, `GET /api/cards/vcf` | QR PNG for card URLs only; vCard download for published cards |

Conversion of a card lead into a LayeredFX lead or opportunity uses the operations commands `cardlead.import` and `cardlead.pipeline` through `/api/operations`. The server replaces client-supplied lead data with the stored record and checks the member can access it.

## Ported features

Builder panels: Content, Sections (show/hide, reorder, spacing), Links (types, visibility, new tab, reorder), Colors (presets, theme toggle for visitors), Splash page (standard/video/slideshow, transition, auto-close), QR code (color, PNG download), Lead form (fields, labels, required), NFC (status, tag URL, Web NFC writing with optional lock), Slideshow, Media (logo size/link, background image, profile shape/outline/link, alignment), Steps, Automations, Settings (slug, status, admin owner assignment), Setup checklist. Live preview at mobile/tablet/desktop widths.

Public card: splash, call/text/email actions, links, lead dialog, QR, intro video, slideshow, steps, copy/share/save contact (vCard)/like, optional visitor light mode.

Leads inbox with status filters. Per-card analytics: views, clicks, shares, saves, leads, likes, QR scans, NFC taps, 14-day chart and top links.

## Deliberate LayeredFX differences

- **Storage:** organization-scoped rows with revision compare-and-swap instead of whole-collection JSONB overwrites. Public traffic increments counters atomically in `lfx_record_card_event` and never makes an editor's save stale. Schema applied 2026-09-14 as `supabase/migrations/20260914_layeredfx_business_cards.sql` (from `docs/migration/sql/business-cards-review-draft.sql`).
- **Access:** staff manage their own cards and leads; admins manage all and may assign cards only to active non-viewer members; viewers are read-only. Other members' cards return 404.
- **Validation:** every field is allowlisted and bounded. Links accept only https/http/mailto/tel/sms; images accept only http(s) URLs. Section types are deduplicated.
- **Public data:** the public page receives a projection without owner identity, automations, revision, NFC status or hidden links.
- **Public endpoints:** origin checks, per-instance throttling, a honeypot field and bounded bodies. Events are accepted only for published cards and valid link IDs. Page views are recorded server-side only.
- **QR route:** only encodes LayeredFX card URLs or the dashboard NFC page. It is not an open QR generator like the source's `?url=` route.
- **Slugs:** existing public URLs are kept unless the editor changes them, so printed QR codes and written tags keep working. Reserved words (`admin`, `api`, …) are refused.
- **Deleting cards:** a card with captured leads must be archived instead. Archived cards can be restored as drafts.
- **Lead conversion:** creates or reuses the canonical operations lead/contact (source "Business Card"). Repeat conversion never duplicates leads, contacts or opportunities. The source's advertiser/client targets do not exist in LayeredFX.

## Not implemented / limits

- **Email automations** (notify owner, auto-reply) are shown but disabled: LayeredFX has no email delivery provider. Nothing is sent.
- **Owner SMS** is sent only when LayeredFX Twilio (`LFX_TWILIO_*`) is configured and the card number is in +country format. It is never sent in development demo mode, and failures do not block lead capture.
- **Image upload** needs the configured LayeredFX Supabase bucket. Development demo mode accepts pasted https image URLs only.
- **NFC writing** works only in Chrome on Android (Web NFC). iPhone users need a separate NFC writing app.
- **Analytics** are per instance for throttling. There is no bot filtering beyond skipping router prefetches.
- **Live Supabase:** tables, `lfx_record_card_event` and the `lfx-card-media` bucket exist in the LayeredFX project. A read-only API check confirmed service-role access (RPC 204) and anon denial (401) for tables and the RPC. Card create/edit, lead capture, event counting and image upload have not yet been exercised through the app against live data.
- **Dev-only payload:** in `next dev`, React's async debug info can embed server-read values (including the local demo store) in page payloads. Production builds do not emit this.
- The mobile dock's "Digital Business Card" quick panel remains the browser-local vCard tool and now links to this module.

## Development demo

`npm run dev` stores cards, leads and events in `.local-data/business-cards/store.json` (git-ignored). The public card origin comes from `NEXT_PUBLIC_SITE_URL`, falling back to `http://localhost:3000` in development.
