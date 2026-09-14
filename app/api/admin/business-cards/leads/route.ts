import {errorResponse} from '@/lib/operations/server';
import {cardRepository} from '@/lib/business-cards/repository';
import {cardActor, privateHeaders} from '@/lib/business-cards/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await cardActor();
    const all = actor.role === 'admin' && new URL(request.url).searchParams.get('scope') === 'all';
    return Response.json({leads: await cardRepository().listLeads(all ? undefined : actor.id)}, {headers: privateHeaders});
  } catch (e) { return errorResponse(e); }
}
