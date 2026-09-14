// Public analytics tracking for published business cards — no sign-in.
import {checkOrigin, errorResponse} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {EVENT_TYPES, deviceFromUA} from '@/lib/business-cards/model';
import {cardRepository} from '@/lib/business-cards/repository';
import {readJsonObject, throttle} from '@/lib/business-cards/server';
import type {EventType} from '@/lib/business-cards/types';

export const dynamic = 'force-dynamic';
// Page views are recorded by the server page itself; clients report interactions only.
const CLIENT_EVENTS = EVENT_TYPES.filter(t => !['view', 'qr_scan', 'nfc_tap', 'lead_submit'].includes(t));

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!throttle(request, 'card-event', 60)) throw new OperationError('Too many requests.', 429);
    const body = await readJsonObject(request, 1000);
    const eventType = body.eventType as EventType;
    if (!CLIENT_EVENTS.includes(eventType)) throw new OperationError('Invalid event.');
    const repo = cardRepository();
    const card = await repo.getCard(String(body.cardId || ''));
    if (!card || card.status !== 'published') throw new OperationError('Card not found.', 404);
    const linkId = eventType === 'link_click' && typeof body.linkId === 'string' && card.links.some(l => l.id === body.linkId) ? body.linkId : null;
    await repo.recordEvent({card_id: card.id, event_type: eventType, link_id: linkId, source: 'public_card', device_type: deviceFromUA(request.headers.get('user-agent') || '')});
    return Response.json({ok: true}, {headers: {'Cache-Control': 'no-store'}});
  } catch (e) { return errorResponse(e); }
}
