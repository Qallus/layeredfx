// Quick card actions from the card list: status, NFC status, owner and delete.
import {checkOrigin, errorResponse} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {normalizeCard, requireCardAccess, requireCardWriter, requireRevision} from '@/lib/business-cards/model';
import {cardRepository} from '@/lib/business-cards/repository';
import {cardActor, ownerOptions, privateHeaders, readJsonObject} from '@/lib/business-cards/server';

export const dynamic = 'force-dynamic';
type Params = {params: Promise<{id: string}>};

async function load(request: Request, params: Params['params']) {
  checkOrigin(request);
  const actor = await cardActor();
  requireCardWriter(actor);
  const body = await readJsonObject(request, 4000);
  const revision = requireRevision(body.revision);
  const repo = cardRepository();
  const card = await repo.getCard((await params).id);
  requireCardAccess(actor, card);
  if (card.revision !== revision) throw new OperationError('This card changed. Reload before trying again.', 409);
  return {actor, body, revision, repo, card};
}

export async function PATCH(request: Request, {params}: Params) {
  try {
    const {actor, body, revision, repo, card} = await load(request, params);
    const patch: Record<string, unknown> = {};
    for (const key of ['status', 'nfc_status', 'owner_id'] as const) if (body[key] !== undefined) patch[key] = body[key];
    if (!Object.keys(patch).length) throw new OperationError('Nothing to update.');
    // The same normalizer as a full save, so quick actions cannot bypass ownership or status rules.
    const updated = normalizeCard(patch, card, {actor, owners: await ownerOptions(), now: new Date().toISOString()});
    updated.slug = card.slug;
    return Response.json({card: await repo.updateCard(updated, revision, actor.id)}, {headers: privateHeaders});
  } catch (e) { return errorResponse(e); }
}

export async function DELETE(request: Request, {params}: Params) {
  try {
    const {revision, repo, card} = await load(request, params);
    await repo.deleteCard(card.id, revision);
    return Response.json({deleted: true}, {headers: privateHeaders});
  } catch (e) { return errorResponse(e); }
}
