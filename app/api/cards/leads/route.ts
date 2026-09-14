// Public "Send me your info" lead capture — no sign-in. Adapted from Channel Cast
// app/api/cards/leads/route.ts with origin checks, throttling and field validation.
import {checkOrigin, errorResponse} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {deviceFromUA, normalizeLeadInput} from '@/lib/business-cards/model';
import {cardRepository} from '@/lib/business-cards/repository';
import {runLeadAutomations} from '@/lib/business-cards/notify';
import {readJsonObject, throttle} from '@/lib/business-cards/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!throttle(request, 'card-lead', 6)) throw new OperationError('Please wait a minute before trying again.', 429);
    const body = await readJsonObject(request, 16_000);
    if (body.website) throw new OperationError('Could not submit the form.');
    const repo = cardRepository();
    const card = await repo.getCard(String(body.cardId || ''));
    if (!card) throw new OperationError('This card is not accepting details right now.', 404);
    const values = normalizeLeadInput(body, card);
    await repo.createLead({...values, card_id: card.id, owner_id: card.owner_id, card_name: card.display_name || card.card_name, source: 'public_card'});
    // The lead is stored; analytics and notifications are best-effort after that.
    await repo.recordEvent({card_id: card.id, event_type: 'lead_submit', link_id: null, source: 'public_card', device_type: deviceFromUA(request.headers.get('user-agent') || '')}).catch(() => {});
    await runLeadAutomations(card, values);
    return Response.json({saved: true}, {status: 201, headers: {'Cache-Control': 'no-store'}});
  } catch (e) { return errorResponse(e); }
}
