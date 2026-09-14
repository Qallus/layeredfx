// Adapted from Channel Cast OS app/api/admin/business-cards/route.ts.
import {checkOrigin, errorResponse} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {cardStats, normalizeCard, requireCardAccess, requireCardWriter, requireRevision} from '@/lib/business-cards/model';
import {cardRepository} from '@/lib/business-cards/repository';
import {automationSupport} from '@/lib/business-cards/notify';
import {cardActor, ownerOptions, privateHeaders, readJsonObject, resolveSlug, siteUrl} from '@/lib/business-cards/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const actor = await cardActor();
    const all = actor.role === 'admin' && new URL(request.url).searchParams.get('scope') === 'all';
    const repo = cardRepository();
    const [cards, leads, owners] = await Promise.all([repo.listCards(all ? undefined : actor.id), repo.listLeads(all ? undefined : actor.id), actor.role === 'admin' ? ownerOptions() : Promise.resolve([])]);
    return Response.json({cards, stats: cardStats(cards, leads), actor: {id: actor.id, name: actor.name, email: actor.email ?? null, role: actor.role}, ownerOptions: owners, siteUrl: siteUrl(), automations: automationSupport()}, {headers: privateHeaders});
  } catch (e) { return errorResponse(e); }
}

async function save(request: Request) {
  try {
    checkOrigin(request);
    const actor = await cardActor();
    requireCardWriter(actor);
    const body = await readJsonObject(request, 300_000);
    const repo = cardRepository();
    const owners = await ownerOptions();
    const now = new Date().toISOString();
    if (request.method === 'POST') {
      const card = normalizeCard(body, null, {actor, owners, now});
      card.slug = await resolveSlug(repo, card, null);
      return Response.json({card: await repo.createCard(card, actor.id)}, {status: 201, headers: privateHeaders});
    }
    const revision = requireRevision(body.revision);
    const existing = await repo.getCard(String(body.id || ''));
    requireCardAccess(actor, existing);
    if (existing.revision !== revision) throw new OperationError('This card changed. Reload before saving again.', 409);
    const card = normalizeCard(body, existing, {actor, owners, now});
    card.slug = await resolveSlug(repo, card, existing);
    return Response.json({card: await repo.updateCard(card, revision, actor.id)}, {headers: privateHeaders});
  } catch (e) { return errorResponse(e); }
}
export const POST = save;
export const PATCH = save;
