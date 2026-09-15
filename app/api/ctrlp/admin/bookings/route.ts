// Feeds the adapted CTRL+P /admin/bookings screen with LayeredFX bookings. More specific than the
// /api/ctrlp/[...path] placeholder, which keeps answering every other unintegrated workflow with 503.
import {checkOrigin, currentActor, errorResponse, mode, people} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {readBody} from '@/lib/operations/security.mjs';
import {appointments} from '@/lib/bookings/catalog';
import {MAX_DAYS_AHEAD, staffUpdate, type Booking} from '@/lib/bookings/model';
import {getBooking, listBookings, listNotifications, saveBooking} from '@/lib/bookings/server';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'private, no-store'};
// Local demo mode has no signed-in member (matching the other dashboard APIs); live mode always verifies membership.
const staff = async () => mode() === 'demo' ? {id: 'demo-admin', name: 'Local demo', email: '', role: 'admin' as const} : currentActor();
const adminAppointment = (booking: Booking) => ({...booking, appointment_type_id: booking.appointment_type, customer_id: null, related_order_id: null, related_job_id: null});

async function jsonBody(request: Request) {
  let body: unknown;
  try { body = JSON.parse(await readBody(request, 16000)); }
  catch (e) { if (e instanceof OperationError) throw e; throw new OperationError('Invalid request.', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new OperationError('Invalid request.', 400);
  return body as Record<string, unknown>;
}
// Appointment types, availability rules and blocked time are not stored yet, so those writes never report success.
function notIntegrated() {
  const message = 'Appointment types, availability and blocked time are not connected yet. No change was saved.';
  return Response.json({error: message, message, configurationRequired: true}, {status: 503, headers});
}

export async function GET(request: Request) {
  try {
    await staff();
    // ?summary=1 feeds the sidebar badge without sending every booking.
    if (new URL(request.url).searchParams.get('summary') === '1') {
      const now = Date.now(), bookings = await listBookings();
      return Response.json({
        upcoming: bookings.filter(item => !['canceled', 'completed', 'no_show'].includes(item.status) && Date.parse(item.start_time) >= now).length,
        pending: bookings.filter(item => item.status === 'pending').length,
      }, {headers});
    }
    const [bookings, notifications, members] = await Promise.all([listBookings(), listNotifications(), mode() === 'demo' ? Promise.resolve([]) : people()]);
    return Response.json({
      appointments: bookings.map(adminAppointment),
      appointmentTypes: appointments.map(item => ({id: item.slug, name: item.name, slug: item.slug, description: item.description, duration_minutes: item.minutes, buffer_before_minutes: 0, buffer_after_minutes: 0, min_notice_minutes: 0, max_days_in_advance: MAX_DAYS_AHEAD, location_type: item.locationType, meeting_url: null, color: item.color, is_active: true})),
      availabilityRules: [], blockedTimes: [], notifications,
      users: members.filter(member => member.role !== 'viewer').map(member => ({id: member.id, full_name: member.name, email: member.email, role: member.role})),
      orders: [], productionJobs: [],
    }, {headers});
  } catch (e) { return errorResponse(e); }
}

export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const actor = await staff();
    if (actor.role === 'viewer') throw new OperationError('This account is read-only.', 403);
    const body = await jsonBody(request);
    if (body.resource !== 'appointment') return notIntegrated();
    const booking = typeof body.id === 'string' ? await getBooking(body.id) : null;
    if (!booking) throw new OperationError('Appointment not found.', 404);
    const next = staffUpdate(booking, body, mode() === 'demo' ? [] : await people(), actor.name);
    const saved = next === booking ? booking : await saveBooking(next, booking.revision);
    return Response.json({appointment: adminAppointment(saved)}, {headers});
  } catch (e) { return errorResponse(e); }
}

async function unsupported(request: Request) {
  try {
    checkOrigin(request);
    const actor = await staff();
    if (actor.role === 'viewer') throw new OperationError('This account is read-only.', 403);
    await readBody(request, 16000);
    return notIntegrated();
  } catch (e) { return errorResponse(e); }
}
export const POST = unsupported;
export const DELETE = unsupported;
