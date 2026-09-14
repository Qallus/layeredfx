import {errorResponse} from '@/lib/operations/server';
import {requireCardAccess, summarizeAnalytics} from '@/lib/business-cards/model';
import {cardRepository} from '@/lib/business-cards/repository';
import {cardActor, privateHeaders} from '@/lib/business-cards/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const actor = await cardActor();
    const repo = cardRepository();
    const card = await repo.getCard((await params).id);
    requireCardAccess(actor, card);
    const requested = Number(new URL(request.url).searchParams.get('range') || 30);
    const rangeDays = [7, 30, 90].includes(requested) ? requested : 30;
    const now = Date.now();
    const [events, leads] = await Promise.all([repo.events(card.id, new Date(now - rangeDays * 86_400_000).toISOString()), repo.listLeads(actor.role === 'admin' ? undefined : actor.id)]);
    return Response.json({analytics: summarizeAnalytics(events, card, leads.filter(l => l.card_id === card.id).length, rangeDays, now)}, {headers: privateHeaders});
  } catch (e) { return errorResponse(e); }
}
