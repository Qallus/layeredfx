import {checkOrigin, errorResponse} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {LEAD_STATUSES, requireCardWriter, requireRevision} from '@/lib/business-cards/model';
import {cardRepository} from '@/lib/business-cards/repository';
import {cardActor, privateHeaders, readJsonObject} from '@/lib/business-cards/server';
import type {LeadStatus} from '@/lib/business-cards/types';

export const dynamic = 'force-dynamic';
type Params = {params: Promise<{id: string}>};

async function load(request: Request, params: Params['params']) {
  checkOrigin(request);
  const actor = await cardActor();
  requireCardWriter(actor);
  const body = await readJsonObject(request, 2000);
  const revision = requireRevision(body.revision);
  const repo = cardRepository();
  const lead = await repo.getLead((await params).id);
  if (!lead || (actor.role !== 'admin' && lead.owner_id !== actor.id)) throw new OperationError('Lead not found.', 404);
  if (lead.revision !== revision) throw new OperationError('This lead changed. Reload before trying again.', 409);
  return {body, revision, repo, lead};
}

export async function PATCH(request: Request, {params}: Params) {
  try {
    const {body, revision, repo, lead} = await load(request, params);
    if (!LEAD_STATUSES.includes(body.status as LeadStatus)) throw new OperationError('Choose a valid lead status.');
    return Response.json({lead: await repo.updateLeadStatus(lead.id, revision, body.status as LeadStatus)}, {headers: privateHeaders});
  } catch (e) { return errorResponse(e); }
}

export async function DELETE(request: Request, {params}: Params) {
  try {
    const {revision, repo, lead} = await load(request, params);
    await repo.deleteLead(lead.id, revision);
    return Response.json({deleted: true}, {headers: privateHeaders});
  } catch (e) { return errorResponse(e); }
}
