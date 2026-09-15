# LayeredFX dashboard roadmap (2026-09-15)

Decisions: shell first · payments match CTRL+P (Square) · DMs between customers/partners and the team (staff can message anyone; customers cannot message each other) · Eve agent services on the Coolify VPS.

## Findings from reference projects

- **Constructed Matter (CMI, `origin/master`, `apps/cmi-next`)**: split login (`app/login/page.tsx`, `components/auth/auth-layout.tsx`); top bar with inline ⌘K search (`components/dashboard/global-search.tsx`, `/api/search`), PWA install button (`components/pwa/install-app-button.tsx`), theme toggle, notification bell (`components/dashboard/notification-bell.tsx`, derived feed with per-source read markers), sign-out arrow; sidebar (`components/dashboard/nav.tsx`) with profile block and collapse button at the bottom. Almost no animation; no mobile nav.
- **Channel Cast**: business cards are the most complete (splash/opener media, owner email/SMS alerts, auto-reply, NFC, analytics); contacts with five views, detail modal, work-lead page, phone import; pipeline quick tools (Twilio Voice/SMS, Resend email, scheduling with reminders, notes, voice notes with Whisper transcription). **DMs are not implemented**; profiles are localStorage-only; many CRM/communication API routes lack auth checks (do not copy).
- **CTRL+P**: Square (payment links, card charges, refunds, signed webhooks). Invoices are rows in `payments`; no dedicated invoices/quotes tables, no deposits/partial-payment logic, HTML print instead of PDFs, tax not implemented. Checkout does not re-price options/sq-ft server-side (except Wall Studio). Customer document route is unauthenticated. Quotes exist only as versioned pipeline opportunity quotes. Port the good models (product card pricing units, Wall Studio sq-ft/install math, versioned quotes) and fix these gaps.

## LayeredFX today

Working on real data: Contacts, Pipeline, Leads (partially), Business Cards, Bookings, Form Submissions, Portals, Workspace, Plans, Blog, Coupons (Supabase), Top Bar notices, portal. Placeholder CTRL+P screens (empty data, 503 writes, ControlP copy): Analytics, Customers, Designers, Installers, Users, Jobs (CMI), Orders, Projects, Production, Payments, Communications, Messages, Products, Wall Studio admin, Artwork, Shipping, Marketing, Content tab, Agents, Settings, Profile.

## Phases

1. **Shell**: CMI-style auth pages with micro animations; top bar (⌘K search, Get the App, theme, notifications, sign out); sidebar profile block and collapse control at the bottom.
2. **Cleanup**: mark or hide unconnected CTRL+P pages, remove ControlP/Channel Cast copy, unique nav icons, banners only where a screen is really unconnected, move bookings API off `/api/ctrlp`.
3. **People**: one Contacts model where anyone can hold any type/role (contact, lead, prospect, client, designer, installer, vendor, affiliate…), richer fields, more views and detail modals; real profiles with photos for staff and portal users; DMs (customers/partners ↔ team) with unread counts and notifications.
4. **Sales tools**: pipeline quick tools (call, SMS, email, schedule, notes) on opportunities and contacts; business card splash/opener, lead alerts and auto-reply.
5. **Commerce (Square)**: products and services (each / sq ft / linear ft / installation), cart and server-side pricing, checkout, quotes with customer acceptance, invoices with deposits and a payments ledger, receipts, idempotent webhooks.
6. **Eve and Google**: Eve settings and secure integration points for Paperclip (agent management) and Hermes agents on the VPS via OpenRouter (OpenAI, Anthropic); Google Business Profile connection once the listing exists.
