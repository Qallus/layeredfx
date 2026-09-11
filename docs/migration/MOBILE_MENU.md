# Mobile and tablet shortcuts

The dashboard bottom dock appears at viewport widths up to 1100px. It supports horizontal touch scrolling, keyboard focus, active route labels and a persistent Hide/Menu toggle (`lfx:bottom-nav:hidden`). Bottom safe-area padding and FAB/panel offsets keep controls above the dock. Desktop sidebar behavior is unchanged.

Order: Dashboard, Call, SMS, Contacts, Leads, Pipeline, Jobs, Digital Business Card, Camera, Record.

- Call/SMS/Record open the existing persistent quick-tool panels. Closing a panel does not interrupt an active call or recording. Provider configuration requirements remain unchanged.
- Leads opens a searchable modal using the canonical leads list, with phone actions, linked opportunities and access to the full lead manager.
- Digital Business Card edits a browser-local card scoped to the signed-in actor, downloads a vCard and invokes native file sharing when supported. Unsupported sharing falls back to download. This does not create a public hosted card, QR landing page or server-synced profile. It is not a migration of Channel Cast's complete business card builder.
- Camera offers separate photo and video inputs with `capture="environment"`; the phone/browser determines its native capture or file-picker UI. Selected media is previewed locally and can be downloaded or cleared; no media is uploaded. Inputs accept image/video files under 100 MB. Object URLs are released when replaced or closed. Physical Android/iOS camera behavior remains to be verified on device.

Source reviewed: Channel Cast `components/layout/mobile-bottom-nav.tsx` from the source checkout already pinned in `CONTACTS_AND_FAB.md`. Its hide/restore pattern is adapted here with LayeredFX routes, the requested ten-item order and existing communication events. No Channel Cast data, provider credentials or external APIs were reused.

Validation: `scripts/mobile-menu-browser.mjs`; measured results in `docs/reviews/logs/mobile-menu-browser.json`. Phone 390px, tablet 1024px and desktop 1440px were checked in Edge, including all routes, panel placement, persistence, vCard download and a supplied image used as a camera-preview fixture. No actual camera, SMS or phone-call action was performed by the tests.
