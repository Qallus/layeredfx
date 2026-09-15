# Bookings, customer portal appointments and account passwords

## Flow

1. **Public booking (`/book`)**. A guest picks an appointment type, a date, a start time (9:00 AM–4:00 PM Arizona time, 15-minute steps, up to 180 days ahead) and their details. **Book your appointment** posts to `POST /api/bookings`. The server validates everything again, saves the booking as `pending`, sends emails, and shows a confirmation with **Create an account** / **Sign in**.
2. **Dashboard (`/admin/bookings`)**. The adapted CTRL+P screen reads and updates bookings through `app/api/ctrlp/admin/bookings/route.ts` (overrides the `/api/ctrlp/[...path]` placeholder for this path only). Staff can set status, assign an active non-viewer member and keep internal notes; saves use the booking revision and return 409 on stale data. Appointment types, weekly availability and blocked time are **not stored yet** and return `configurationRequired` (no fake success).
3. **Customer portal (`/portal/bookings`)**. Signed-in customers see appointments made with their **confirmed account email** as read-only cards. **Change appointment** (type/date/time) and **Cancel appointment** take effect immediately, update the booking history and notify the customer and team. Past, completed and canceled appointments cannot be changed online.
4. **Emails**. Four templates live in the shared email template store and are editable/duplicable in **Dashboard → Communications → Email → Templates**: `Booking: Confirmation`, `Booking: Updated`, `Booking: Canceled`, `Booking: Team alert`. Only templates set to **Active** send; set Draft/Archived to stop one. Merge tags: `{{first_name}} {{last_name}} {{full_name}} {{email}} {{phone}} {{company}} {{notes}} {{appointment_type}} {{date}} {{time}} {{end_time}} {{duration}} {{location}} {{timezone}} {{status}} {{reference}} {{manage_url}} {{book_url}} {{admin_url}} {{event}}`. A paragraph containing only a link becomes the CTA button. Branding and styles are applied by `lib/bookings/model.ts` at send time because stored template HTML is sanitized (no inline styles or tables). Every attempt is logged in `lfx_booking_notifications` (sent / failed / skipped) and shown in the dashboard Notifications card. Local demo mode never sends email.
5. **Passwords**. `/login` links to **Forgot password** (`/forgot-password`), which asks Supabase Auth to email a recovery link to `/reset-password`. The reset page reads the recovery token from the link, removes it from the address bar and sets a new password (12+ characters). **Portal → Settings** changes the password after re-verifying the current one.

## Storage

`supabase/migrations/20260915_layeredfx_bookings.sql` (applied 2026-09-15 to the LayeredFX project `tdywcdgbavfcsywejoka` as `layeredfx_bookings`): `lfx_bookings` and `lfx_booking_notifications`, RLS enabled, no anon/authenticated grants, service role only. Local demo mode uses `.local-data/bookings.json`.

## Configuration

Server-only environment (`.env.local` and the Coolify runtime):

```dotenv
LFX_RESEND_API_KEY=            # Resend API key; layeredfx.com is verified in Resend
LFX_EMAIL_FROM="LayeredFX <hello@layeredfx.com>"
LFX_EMAIL_REPLY_TO=hello@layeredfx.com
LFX_BOOKING_ALERT_EMAIL=hello@layeredfx.com   # optional team alert inbox
```

Supabase Auth settings (Dashboard → Authentication → URL Configuration), required before password reset works:

- Site URL: `https://layeredfx.com`
- Redirect URLs: `https://layeredfx.com/reset-password`, `https://layeredfx.com/login`, `https://www.layeredfx.com/reset-password`, `https://www.layeredfx.com/login`, and `http://localhost:3000/reset-password` for local testing.
- Custom SMTP (for example Resend SMTP) so recovery and confirmation emails are not limited by the built-in mailer.

## Verification (2026-09-15)

- `npm run typecheck`, `npm run lint -- --quiet`: pass. `npm test`: 195 pass, including `tests/bookings.test.mjs` (booking validation, instant change/cancel, staff updates, customer-safe views, email escaping/CTA, public/portal/dashboard route security).
- Browser (Edge, local demo mode): booking flow to confirmation; booking listed and confirmed in `/admin/bookings`; read-only portal card; change and cancel; portal Settings; login/register/forgot/reset pages; booking templates with Duplicate in the dashboard; confirmation email rendering.
- Not yet verified live: sending through Resend, Supabase recovery emails, and booking reads/writes against the hosted database through the running app.

## Limits

- Availability, buffers, blocked time and double-booking prevention are not enforced; the team manages conflicts.
- Guest bookings send a confirmation to the entered address; per-IP rate limiting (5 per 10 minutes) and a spam trap limit abuse.
- Staff status changes in the dashboard do not email the customer.
- Deleted default booking templates are restored automatically; use Draft or Archived to stop sending instead.
