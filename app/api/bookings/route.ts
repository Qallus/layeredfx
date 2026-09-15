// Public guest booking from /book. Saves the appointment, then sends the confirmation and team alert.
import {checkOrigin, errorResponse} from '@/lib/operations/server';
import {readBody} from '@/lib/operations/security.mjs';
import {OperationError} from '@/lib/operations/engine.mjs';
import {customerView, newPublicBooking} from '@/lib/bookings/model';
import {createBooking, notifyBooking} from '@/lib/bookings/server';

const WINDOW_MS = 10 * 60 * 1000, MAX_ATTEMPTS = 5;
const attempts = new Map<string, {at: number; count: number}>();

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local', now = Date.now(), prior = attempts.get(key);
    const recent = prior && now - prior.at < WINDOW_MS;
    if (recent && prior.count >= MAX_ATTEMPTS) throw new OperationError('Too many booking attempts. Please wait a few minutes or call us.', 429);
    if (attempts.size > 2000) attempts.clear();
    attempts.set(key, recent ? {at: prior.at, count: prior.count + 1} : {at: now, count: 1});
    let body: unknown;
    try { body = JSON.parse(await readBody(request, 12000)); }
    catch (e) { if (e instanceof OperationError) throw e; throw new OperationError('Invalid request.', 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new OperationError('Invalid request.', 400);
    const input = body as Record<string, unknown>;
    if (input.website) throw new OperationError('Could not submit the booking.', 400);
    const booking = await createBooking(newPublicBooking(input));
    const email = await notifyBooking(booking, 'booked');
    return Response.json({booking: customerView(booking), email: email.customer}, {status: 201, headers: {'Cache-Control': 'no-store'}});
  } catch (e) { return errorResponse(e); }
}
