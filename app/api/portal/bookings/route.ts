// Customer portal bookings: appointments made with the signed-in account's confirmed email.
// Changes and cancellations take effect immediately and notify the customer and team.
import {checkOrigin, errorResponse} from '@/lib/operations/server';
import {readBody} from '@/lib/operations/security.mjs';
import {OperationError} from '@/lib/operations/engine.mjs';
import {currentPortal, portalDemo} from '@/lib/portal/server';
import {customerChange, customerView} from '@/lib/bookings/model';
import {bookingsForEmail, getBooking, listBookings, notifyBooking, saveBooking} from '@/lib/bookings/server';

const headers = {'Cache-Control': 'private, no-store'};
/** The account email that owns bookings, or null in the local portal preview (which shows bookings made on this device). */
async function ownerEmail() { return portalDemo() ? null : (await currentPortal()).email.toLowerCase(); }

export async function GET() {
  try {
    const email = await ownerEmail();
    const bookings = email === null ? (await listBookings()).reverse() : await bookingsForEmail(email);
    return Response.json({bookings: bookings.map(item => customerView(item)), preview: email === null}, {headers});
  } catch (e) { return errorResponse(e); }
}

export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const email = await ownerEmail();
    let body: unknown;
    try { body = JSON.parse(await readBody(request, 4000)); }
    catch (e) { if (e instanceof OperationError) throw e; throw new OperationError('Invalid request.', 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new OperationError('Invalid request.', 400);
    const input = body as Record<string, unknown>;
    const booking = typeof input.id === 'string' ? await getBooking(input.id) : null;
    if (!booking || (email !== null && booking.customer_email !== email)) throw new OperationError('Appointment not found.', 404);
    const next = customerChange(booking, input);
    const saved = await saveBooking(next, booking.revision);
    const notification = await notifyBooking(saved, saved.status === 'canceled' ? 'canceled' : 'rescheduled');
    return Response.json({booking: customerView(saved), email: notification.customer}, {headers});
  } catch (e) { return errorResponse(e); }
}
