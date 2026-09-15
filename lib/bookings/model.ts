// Booking rules shared by the public booking API, the customer portal and /admin/bookings.
// Pure functions: no storage or provider access, so they are unit tested directly.
import {OperationError} from '@/lib/operations/engine.mjs';
import {appointmentBySlug, BOOKING_TIMEZONE, type AppointmentOption} from '@/lib/bookings/catalog';

export const BOOKING_STATUSES = ['pending', 'confirmed', 'rescheduled', 'canceled', 'completed', 'no_show', 'follow_up_needed', 'awaiting_payment', 'awaiting_deposit', 'awaiting_customer_info', 'awaiting_approval'] as const;
export type BookingStatus = typeof BOOKING_STATUSES[number];
export type BookingHistory = {at: string; actor: 'customer' | 'staff'; action: string; detail: string};
export type Booking = {
  id: string; appointment_type: string; title: string; location_type: string; start_time: string; end_time: string; timezone: string; status: BookingStatus;
  customer_first_name: string; customer_last_name: string; customer_email: string; customer_phone: string; company_name: string; customer_notes: string;
  internal_notes: string; assigned_staff_id: string | null; source: 'public_booking' | 'portal' | 'dashboard'; history: BookingHistory[]; revision: number; created_at: string; updated_at: string;
};
export type CustomerBooking = Omit<Booking, 'internal_notes' | 'assigned_staff_id' | 'history'> & {minutes: number; location: string; can_change: boolean};

// Start times offered by BookingChoices: 9:00 AM to 4:00 PM Arizona time in 15-minute steps.
export const FIRST_SLOT_MINUTES = 9 * 60;
export const LAST_SLOT_MINUTES = 16 * 60;
export const SLOT_STEP_MINUTES = 15;
export const MAX_DAYS_AHEAD = 180;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLOSED: BookingStatus[] = ['canceled', 'completed', 'no_show'];
const HISTORY_LIMIT = 100;

function text(value: unknown, max: number, label: string) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new OperationError(`Invalid ${label.toLowerCase()}.`, 400);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new OperationError(`${label} is too long.`, 400);
  return trimmed;
}
function appointment(slug: unknown): AppointmentOption {
  const found = typeof slug === 'string' ? appointmentBySlug(slug) : undefined;
  if (!found) throw new OperationError('Choose an appointment type.', 400);
  return found;
}
const withHistory = (history: BookingHistory[], entry: BookingHistory) => [...history, entry].slice(-HISTORY_LIMIT);

/** Converts a picked Arizona date and start time into a validated UTC window. */
export function bookingWindow(date: unknown, time: unknown, minutes: number, now = Date.now()) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new OperationError('Choose a valid date.', 400);
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) throw new OperationError('Choose a valid time.', 400);
  const [hours, mins] = time.split(':').map(Number), total = hours * 60 + mins;
  if (total < FIRST_SLOT_MINUTES || total > LAST_SLOT_MINUTES || (total - FIRST_SLOT_MINUTES) % SLOT_STEP_MINUTES !== 0) throw new OperationError('Choose one of the available start times.', 400);
  const start = new Date(`${date}T${time}:00-07:00`); // Arizona does not observe daylight saving time.
  if (Number.isNaN(start.getTime()) || new Intl.DateTimeFormat('en-CA', {timeZone: BOOKING_TIMEZONE}).format(start) !== date) throw new OperationError('Choose a valid date.', 400);
  if (start.getTime() <= now) throw new OperationError('Choose a time in the future.', 400);
  if (start.getTime() > now + MAX_DAYS_AHEAD * 86400000) throw new OperationError(`Appointments can be booked up to ${MAX_DAYS_AHEAD} days ahead.`, 400);
  return {start_time: start.toISOString(), end_time: new Date(start.getTime() + minutes * 60000).toISOString()};
}

export function newPublicBooking(body: Record<string, unknown>, now = Date.now()): Booking {
  const id = typeof body.id === 'string' && UUID.test(body.id) ? body.id.toLowerCase() : '';
  if (!id) throw new OperationError('Invalid booking request.', 400);
  const type = appointment(body.appointment);
  const first = text(body.firstName, 75, 'First name'), last = text(body.lastName, 75, 'Last name');
  if (!first || !last) throw new OperationError('Enter your first and last name.', 400);
  const email = text(body.email, 254, 'Email').toLowerCase();
  if (!EMAIL.test(email)) throw new OperationError('Enter a valid email address.', 400);
  const phone = text(body.phone, 40, 'Phone');
  if (phone && !/^\+?[\d ().-]{7,40}$/.test(phone)) throw new OperationError('Enter a valid phone number.', 400);
  const at = new Date(now).toISOString();
  return {
    id, appointment_type: type.slug, title: type.name, location_type: type.locationType, ...bookingWindow(body.date, body.time, type.minutes, now), timezone: BOOKING_TIMEZONE, status: 'pending',
    customer_first_name: first, customer_last_name: last, customer_email: email, customer_phone: phone, company_name: text(body.company, 200, 'Company'), customer_notes: text(body.message, 3000, 'Message'),
    internal_notes: '', assigned_staff_id: null, source: 'public_booking', history: [{at, actor: 'customer', action: 'booked', detail: `${type.name} booked`}], revision: 0, created_at: at, updated_at: at,
  };
}

export const customerCanChange = (booking: Booking, now = Date.now()) => !CLOSED.includes(booking.status) && Date.parse(booking.start_time) > now;

/** Customer changes take effect immediately: cancel, or move to a new type/date/time. */
export function customerChange(booking: Booking, body: Record<string, unknown>, now = Date.now()): Booking {
  if (body.revision !== booking.revision) throw new OperationError('This appointment changed. Reload before trying again.', 409);
  if (!customerCanChange(booking, now)) throw new OperationError('This appointment can no longer be changed online. Please contact us.', 409);
  const at = new Date(now).toISOString();
  if (body.action === 'cancel') return {...booking, status: 'canceled', revision: booking.revision + 1, updated_at: at, history: withHistory(booking.history, {at, actor: 'customer', action: 'canceled', detail: 'Canceled by customer'})};
  if (body.action !== 'reschedule') throw new OperationError('Unsupported change.', 400);
  const type = appointment(body.appointment), slot = bookingWindow(body.date, body.time, type.minutes, now);
  if (slot.start_time === booking.start_time && type.slug === booking.appointment_type) throw new OperationError('Choose a different date, time or appointment type.', 400);
  return {
    ...booking, appointment_type: type.slug, title: type.name, location_type: type.locationType, ...slot, status: 'rescheduled', revision: booking.revision + 1, updated_at: at,
    history: withHistory(booking.history, {at, actor: 'customer', action: 'rescheduled', detail: `${booking.title} at ${booking.start_time} moved to ${type.name} at ${slot.start_time}`}),
  };
}

/** Staff edits from /admin/bookings. Returns the same object when nothing changed. */
export function staffUpdate(booking: Booking, body: Record<string, unknown>, members: {id: string; role: string}[], actorName: string, now = Date.now()): Booking {
  if (body.revision !== booking.revision) throw new OperationError('This appointment changed. Reload before saving again.', 409);
  if (body.related_order_id || body.related_job_id) throw new OperationError('Orders and production jobs are not connected to bookings yet.', 400);
  const status = String(body.status);
  if (!(BOOKING_STATUSES as readonly string[]).includes(status)) throw new OperationError('Invalid appointment status.', 400);
  const internalNotes = text(body.internal_notes, 5000, 'Internal notes');
  const assigned = body.assigned_staff_id === null || body.assigned_staff_id === undefined || body.assigned_staff_id === '' ? null : String(body.assigned_staff_id);
  if (assigned && !members.some(member => member.id === assigned && member.role !== 'viewer')) throw new OperationError('Assign an active staff member.', 400);
  const changes = [booking.status !== status && `status ${booking.status} → ${status}`, booking.assigned_staff_id !== assigned && 'assignment changed', booking.internal_notes !== internalNotes && 'internal notes updated'].filter(Boolean) as string[];
  if (!changes.length) return booking;
  const at = new Date(now).toISOString();
  return {...booking, status: status as BookingStatus, internal_notes: internalNotes, assigned_staff_id: assigned, revision: booking.revision + 1, updated_at: at, history: withHistory(booking.history, {at, actor: 'staff', action: 'updated', detail: `${actorName}: ${changes.join(', ')}`})};
}

/** Appointment fields copied onto a lead when a booking is added to Leads or Pipeline. */
export type OperationsBooking = {id: string; title: string; startTime: string; endTime: string; status: string; location: string; firstName: string; lastName: string; email: string; phone: string; company: string; notes: string; createdAt: string};
export type BookingLike = {id: string; title: string; start_time: string; end_time: string; status: string; location_type: string; customer_first_name: string | null; customer_last_name: string | null; customer_email: string | null; customer_phone: string | null; company_name: string | null; customer_notes: string | null; created_at?: string};
export function operationsBooking(booking: BookingLike): OperationsBooking {
  return {
    id: booking.id, title: booking.title, startTime: booking.start_time, endTime: booking.end_time, status: booking.status, location: human(booking.location_type),
    firstName: booking.customer_first_name || '', lastName: booking.customer_last_name || '', email: booking.customer_email || '', phone: booking.customer_phone || '',
    company: booking.company_name || '', notes: booking.customer_notes || '', createdAt: booking.created_at || '',
  };
}

/** What a customer may see: no internal notes, staff assignment or audit history. */
export function customerView(booking: Booking, now = Date.now()): CustomerBooking {
  const {internal_notes: _notes, assigned_staff_id: _assigned, history: _history, ...visible} = booking;
  void _notes; void _assigned; void _history;
  const type = appointmentBySlug(booking.appointment_type);
  return {...visible, minutes: type?.minutes ?? Math.round((Date.parse(booking.end_time) - Date.parse(booking.start_time)) / 60000), location: type?.location ?? 'Confirmed by the team', can_change: customerCanChange(booking, now)};
}

// ── Email content ────────────────────────────────────────────────────────────────

export const human = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
export function formatWhen(iso: string) {
  const date = new Date(iso);
  return {
    date: new Intl.DateTimeFormat('en-US', {timeZone: BOOKING_TIMEZONE, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'}).format(date),
    time: new Intl.DateTimeFormat('en-US', {timeZone: BOOKING_TIMEZONE, hour: 'numeric', minute: '2-digit'}).format(date),
  };
}
/** Merge tag values available to booking email templates. */
export function bookingVariables(booking: Booking, origin: string): Record<string, string> {
  const start = formatWhen(booking.start_time), view = customerView(booking);
  return {
    first_name: booking.customer_first_name, last_name: booking.customer_last_name, full_name: `${booking.customer_first_name} ${booking.customer_last_name}`.trim(),
    email: booking.customer_email, phone: booking.customer_phone || 'Not provided', company: booking.company_name || 'Not provided', notes: booking.customer_notes || 'None',
    appointment_type: booking.title, date: start.date, time: start.time, end_time: formatWhen(booking.end_time).time, duration: `${view.minutes} minutes`, location: view.location,
    timezone: 'Arizona time', status: human(booking.status), reference: booking.id.slice(0, 8).toUpperCase(),
    manage_url: `${origin}/portal/bookings`, book_url: `${origin}/book`, admin_url: `${origin}/admin/bookings`,
  };
}
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char]!);
/** Replaces {{merge_tags}} in template HTML; values are HTML-escaped, unknown tags are left visible. */
export const fillTemplate = (template: string, vars: Record<string, string>) => template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (tag, key: string) => key in vars ? escapeHtml(vars[key]) : tag);
/** Replaces merge tags in plain text (subject, preview line). */
export const fillText = (template: string, vars: Record<string, string>) => template.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (tag, key: string) => key in vars ? vars[key] : tag).replace(/[\r\n]+/g, ' ').trim();

const BUTTON_PARAGRAPH = /<p>\s*<a href="([^"]+)">([\s\S]*?)<\/a>\s*<\/p>/g;
/**
 * Wraps sanitized template HTML in the LayeredFX email layout. Stored templates cannot hold inline styles, so styles
 * are applied here; a paragraph containing only a link becomes the call-to-action button.
 */
export function emailHtml({bodyHtml, preheader, origin}: {bodyHtml: string; preheader: string; origin: string}) {
  const buttons: string[] = [];
  let html = bodyHtml.replace(BUTTON_PARAGRAPH, (_match, href: string, label: string) => {
    buttons.push(`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 22px"><tr><td style="border-radius:10px;background:#d6ff41"><a href="${href}" style="display:inline-block;padding:14px 26px;border-radius:10px;color:#19202e;font-size:15px;font-weight:600;text-decoration:none">${label}</a></td></tr></table>`);
    return `%%LFX_BUTTON_${buttons.length - 1}%%`;
  });
  html = html
    .replace(/<h1>/g, '<h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;font-weight:500;letter-spacing:-0.4px;color:#19202e">')
    .replace(/<h2>/g, '<h2 style="margin:26px 0 10px;font-size:18px;line-height:1.3;font-weight:600;color:#19202e">')
    .replace(/<p>/g, '<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#47536b">')
    .replace(/<ul>/g, '<ul style="margin:6px 0 18px;padding:4px 18px;list-style:none;background:#f7f9fb;border:1px solid #c9ced8;border-radius:12px">')
    .replace(/<li>/g, '<li style="padding:9px 0;font-size:14px;line-height:1.5;color:#19202e;border-bottom:1px solid #eef1f5">')
    .replace(/<strong>/g, '<strong style="color:#19202e;font-weight:600">')
    .replace(/<hr\s*\/?>/g, '<hr style="border:0;border-top:1px solid #c9ced8;margin:24px 0"/>')
    .replace(/<a href="/g, '<a style="color:#63790d;text-decoration:underline" href="')
    .replace(/%%LFX_BUTTON_(\d+)%%/g, (_match, index: string) => buttons[Number(index)]);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>LayeredFX</title></head>`
    + `<body style="margin:0;padding:0;background:#f7f9fb;font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">`
    + `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fb"><tr><td align="center" style="padding:32px 14px">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">`
    + `<tr><td style="background:#19202e;border-radius:16px 16px 0 0;padding:24px 32px"><a href="${origin}" style="text-decoration:none"><img src="${origin}/brand/LayeredFX_logo_dark_outline_email.png" alt="LayeredFX" width="168" style="display:block;border:0;height:auto;color:#ffffff;font-size:22px;font-weight:700"/></a></td></tr>`
    + `<tr><td style="background:#ffffff;padding:34px 32px 24px;border-radius:0 0 16px 16px">${html}</td></tr>`
    + `<tr><td style="padding:22px 24px;text-align:center;font-size:12px;line-height:1.7;color:#47536b">LayeredFX · Scottsdale, Arizona<br/><a href="mailto:hello@layeredfx.com" style="color:#47536b">hello@layeredfx.com</a> · <a href="${origin}" style="color:#47536b">layeredfx.com</a><br/>You are receiving this email because an appointment was booked with this address.</td></tr>`
    + `</table></td></tr></table></body></html>`;
}
/** Plain-text alternative for email clients that do not render HTML. */
export function emailText(bodyHtml: string) {
  return bodyHtml
    .replace(/<a href="([^"]+)">([\s\S]*?)<\/a>/g, '$2: $1')
    .replace(/<li>/g, '- ').replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|h1|h2|h3|li|ul|div)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim();
}
