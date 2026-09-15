import 'server-only';
// Booking persistence and email notifications. Local development (demo mode) uses a file store under .local-data
// and never contacts Resend; live mode uses the LayeredFX Supabase service role and sends through Resend.
import {mkdir, open, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {ContentItem} from '@/ctrlp/lib/admin/types';
import {readBlog} from '@/lib/blog/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {configured, mode} from '@/lib/operations/server';
import {isUuid} from '@/lib/operations/security.mjs';
import {bookingVariables, emailHtml, emailText, fillTemplate, fillText, type Booking} from './model';
import {BOOKING_TEMPLATE_SLUGS, bookingTemplates, type BookingEmailEvent, type BookingNotificationType} from './templates';

export type BookingNotification = {id: string; appointment_id: string; channel: 'email'; notification_type: BookingNotificationType; recipient: string; status: 'sent' | 'failed' | 'skipped'; error_message: string | null; created_at: string};
type LocalStore = {bookings: Booking[]; notifications: BookingNotification[]};
const COLUMNS = 'id,appointment_type,title,location_type,start_time,end_time,timezone,status,customer_first_name,customer_last_name,customer_email,customer_phone,company_name,customer_notes,internal_notes,assigned_staff_id,source,history,revision,created_at,updated_at';
const siteOrigin = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://layeredfx.com').replace(/\/$/, '');
const stale = () => new OperationError('This appointment changed. Reload before trying again.', 409);

// ── Local development store ─────────────────────────────────────────────────────

const localFile = () => path.join(process.cwd(), '.local-data', 'bookings.json');
async function readLocal(): Promise<LocalStore> {
  try { return JSON.parse(await readFile(localFile(), 'utf8')); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {bookings: [], notifications: []}; throw e; }
}
async function mutateLocal<T>(change: (store: LocalStore) => T): Promise<T> {
  await mkdir(path.dirname(localFile()), {recursive: true});
  let lock;
  try { lock = await open(localFile() + '.lock', 'wx'); } catch { throw new OperationError('Another booking is saving. Please try again.', 409); }
  try {
    const store = await readLocal();
    const result = change(store);
    store.notifications = store.notifications.slice(-2000);
    await writeFile(localFile() + '.tmp', JSON.stringify(store));
    await rename(localFile() + '.tmp', localFile());
    return result;
  } finally { await lock.close(); await unlink(localFile() + '.lock'); }
}

// ── LayeredFX Supabase store ────────────────────────────────────────────────────

function connection() {
  const org = process.env.LFX_OPERATIONS_ORG_ID;
  if (!configured() || !isUuid(org)) throw new OperationError('Booking storage is not configured. Please call or email us.', 503);
  const url = new URL(process.env.LFX_SUPABASE_URL!);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new OperationError('Booking storage requires HTTPS.', 503);
  return {origin: url.origin, key: process.env.LFX_SUPABASE_SERVICE_ROLE_KEY!, org: org as string};
}
/** Scoped requests always filter by organization; inserts set org_id in the body instead. */
async function rest<T>(table: string, params: Record<string, string>, init: RequestInit = {}, scoped = true): Promise<T> {
  const c = connection();
  const search = new URLSearchParams(scoped ? {...params, org_id: `eq.${c.org}`} : params);
  const response = await fetch(`${c.origin}/rest/v1/${table}?${search}`, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(12000),
    headers: {apikey: c.key, Authorization: `Bearer ${c.key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...init.headers},
  });
  if (response.status === 409) throw new OperationError('This booking was already received.', 409);
  if (!response.ok) throw new OperationError('Booking storage is unavailable. Please call or email us.', 503);
  return response.status === 204 || response.status === 201 && init.headers && JSON.stringify(init.headers).includes('return=minimal') ? (undefined as T) : response.json();
}
const iso = (value: string) => new Date(value).toISOString();
const normalize = (row: Booking): Booking => ({...row, start_time: iso(row.start_time), end_time: iso(row.end_time), created_at: iso(row.created_at), updated_at: iso(row.updated_at), revision: Number(row.revision), history: Array.isArray(row.history) ? row.history : []});

export async function createBooking(booking: Booking): Promise<Booking> {
  if (mode() === 'demo') return mutateLocal(store => {
    if (store.bookings.some(item => item.id === booking.id)) throw new OperationError('This booking was already received.', 409);
    if (store.bookings.length >= 2000) throw new OperationError('The local booking inbox is full.', 503);
    store.bookings.push(booking);
    return booking;
  });
  const rows = await rest<Booking[]>('lfx_bookings', {select: COLUMNS}, {method: 'POST', body: JSON.stringify({...booking, org_id: connection().org})}, false);
  return normalize(rows[0]);
}
export async function listBookings(): Promise<Booking[]> {
  if (mode() === 'demo') return (await readLocal()).bookings.slice().sort((a, b) => a.start_time.localeCompare(b.start_time));
  return (await rest<Booking[]>('lfx_bookings', {select: COLUMNS, order: 'start_time.asc', limit: '1000'})).map(normalize);
}
export async function bookingsForEmail(email: string): Promise<Booking[]> {
  const target = email.trim().toLowerCase();
  if (mode() === 'demo') return (await readLocal()).bookings.filter(item => item.customer_email === target).sort((a, b) => b.start_time.localeCompare(a.start_time));
  return (await rest<Booking[]>('lfx_bookings', {select: COLUMNS, customer_email: `eq.${target}`, order: 'start_time.desc', limit: '200'})).map(normalize);
}
export async function getBooking(id: string): Promise<Booking | null> {
  if (!isUuid(id)) return null;
  if (mode() === 'demo') return (await readLocal()).bookings.find(item => item.id === id) ?? null;
  const rows = await rest<Booking[]>('lfx_bookings', {select: COLUMNS, id: `eq.${id}`});
  return rows[0] ? normalize(rows[0]) : null;
}
/** Compare-and-swap save: fails with 409 if the stored revision moved on. */
export async function saveBooking(next: Booking, expectedRevision: number): Promise<Booking> {
  if (mode() === 'demo') return mutateLocal(store => {
    const index = store.bookings.findIndex(item => item.id === next.id);
    if (index < 0 || store.bookings[index].revision !== expectedRevision) throw stale();
    store.bookings[index] = next;
    return next;
  });
  const {id, created_at: _created, ...changes} = next;
  void _created;
  const rows = await rest<Booking[]>('lfx_bookings', {select: COLUMNS, id: `eq.${id}`, revision: `eq.${expectedRevision}`}, {method: 'PATCH', body: JSON.stringify(changes)});
  if (!rows.length) throw stale();
  return normalize(rows[0]);
}

type NotificationRow = Omit<BookingNotification, 'id' | 'appointment_id'> & {id: number | string; booking_id: string};
export async function listNotifications(limit = 50): Promise<BookingNotification[]> {
  if (mode() === 'demo') return (await readLocal()).notifications.slice(-limit).reverse();
  const rows = await rest<NotificationRow[]>('lfx_booking_notifications', {select: 'id,booking_id,channel,notification_type,recipient,status,error_message,created_at', order: 'created_at.desc', limit: String(limit)});
  return rows.map(({id, booking_id, ...row}) => ({...row, id: String(id), appointment_id: booking_id}));
}
async function recordNotification(entry: Omit<BookingNotification, 'id' | 'created_at'>) {
  if (mode() === 'demo') { await mutateLocal(store => { store.notifications.push({...entry, id: crypto.randomUUID(), created_at: new Date().toISOString()}); }); return; }
  const {appointment_id, ...row} = entry;
  await rest('lfx_booking_notifications', {}, {method: 'POST', headers: {Prefer: 'return=minimal'}, body: JSON.stringify({...row, booking_id: appointment_id, org_id: connection().org})}, false);
}

// ── Email notifications ─────────────────────────────────────────────────────────

const CUSTOMER_EMAIL: Record<BookingEmailEvent, {slug: string; type: BookingNotificationType; label: string}> = {
  booked: {slug: BOOKING_TEMPLATE_SLUGS.booked, type: 'confirmation', label: 'New booking'},
  rescheduled: {slug: BOOKING_TEMPLATE_SLUGS.rescheduled, type: 'updated', label: 'Booking rescheduled'},
  canceled: {slug: BOOKING_TEMPLATE_SLUGS.canceled, type: 'cancelled', label: 'Booking canceled'},
};
async function emailTemplates(): Promise<ContentItem[]> {
  try { return (await readBlog()).items.filter(item => item.content_type === 'email_template'); }
  catch { return bookingTemplates; }
}

/**
 * Emails the customer (and the team inbox when LFX_BOOKING_ALERT_EMAIL is set) using the editable templates.
 * Never throws: the booking is already saved, so every attempt is recorded as sent, failed or skipped instead.
 */
export async function notifyBooking(booking: Booking, event: BookingEmailEvent): Promise<{customer: BookingNotification['status']}> {
  const settings = CUSTOMER_EMAIL[event];
  const vars = {...bookingVariables(booking, siteOrigin()), event: settings.label};
  const templates = await emailTemplates();
  const customer = await deliver(booking, settings.type, settings.slug, booking.customer_email, vars, templates);
  const team = process.env.LFX_BOOKING_ALERT_EMAIL?.trim();
  if (team) await deliver(booking, 'team_alert', BOOKING_TEMPLATE_SLUGS.team, team, vars, templates);
  return {customer};
}
async function deliver(booking: Booking, type: BookingNotificationType, slug: string, to: string, vars: Record<string, string>, templates: ContentItem[]): Promise<BookingNotification['status']> {
  const template = templates.find(item => item.slug === slug) ?? bookingTemplates.find(item => item.slug === slug)!;
  let status: BookingNotification['status'] = 'skipped';
  let error: string | null = null;
  if (mode() === 'demo') error = 'Local demo: email not sent.';
  else if (template.status !== 'published') error = `Template "${template.title}" is not active.`;
  else if (!process.env.LFX_RESEND_API_KEY || !process.env.LFX_EMAIL_FROM) error = 'Email provider is not configured.';
  else {
    const body = fillTemplate(template.content, vars);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(10000),
        headers: {Authorization: `Bearer ${process.env.LFX_RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `lfx-booking-${booking.id}-${type}-${booking.revision}`},
        body: JSON.stringify({
          from: process.env.LFX_EMAIL_FROM, to: [to], ...(process.env.LFX_EMAIL_REPLY_TO ? {reply_to: process.env.LFX_EMAIL_REPLY_TO} : {}),
          subject: fillText(template.subject || template.title, vars).slice(0, 200),
          html: emailHtml({bodyHtml: body, preheader: fillText(template.preheader || '', vars), origin: siteOrigin()}),
          text: emailText(body),
        }),
      });
      if (response.ok) status = 'sent';
      else { status = 'failed'; error = `Email provider returned HTTP ${response.status}.`; }
    } catch { status = 'failed'; error = 'Email provider could not be reached.'; }
  }
  try { await recordNotification({appointment_id: booking.id, channel: 'email', notification_type: type, recipient: to, status, error_message: error}); }
  catch { /* The booking is saved; a missing log entry must not fail the customer's request. */ }
  return status;
}
