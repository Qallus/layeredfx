import { applyCommand, visibleState, OperationError } from '@/lib/operations/engine.mjs';
import { parseCommandBody, verifyRevision, readBody } from '@/lib/operations/security.mjs';
import { currentActor, readState, writeState, checkOrigin, errorResponse } from '@/lib/operations/server';
import {getIntake} from '@/lib/contact/server';
import {metadata} from '@/lib/contact/model';
import {cardRepository} from '@/lib/business-cards/repository';
import {operationsCardLead, requireCardWriter} from '@/lib/business-cards/model';
import {getBooking} from '@/lib/bookings/server';
import {operationsBooking} from '@/lib/bookings/model';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
export async function GET() { try {
    const actor = await currentActor();
    const state = await readState();
    return Response.json({ actor, state: visibleState(state, actor) }, { headers });
}
catch (e) {
    return errorResponse(e);
} }
export async function POST(request: Request) { try {
    checkOrigin(request);
    const actor = await currentActor();
    if (!request.headers.get('content-type')?.includes('application/json'))
        throw new OperationError('JSON is required.', 415);
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > 512000)
        throw new OperationError('Request is too large.', 413);
    const body = parseCommandBody(await readBody(request));
    if(body.command.type==='submission.import'||body.command.type==='submission.pipeline'){if(actor.role==='viewer')throw new OperationError('Staff access required.',403);body.command.submission=metadata(await getIntake(String(body.command.submissionId||'')));}
    if(body.command.type==='booking.import'||body.command.type==='booking.pipeline'){if(actor.role==='viewer')throw new OperationError('Staff access required.',403);const stored=await getBooking(String(body.command.bookingId||''));if(!stored)throw new OperationError('Appointment not found.',404);body.command.booking=operationsBooking(stored);}
    if(body.command.type==='cardlead.import'||body.command.type==='cardlead.pipeline'){requireCardWriter(actor);const stored=await cardRepository().getLead(String(body.command.cardLeadId||''));if(!stored||(actor.role!=='admin'&&stored.owner_id!==actor.id))throw new OperationError('Card lead not found.',404);body.command.cardLead=operationsCardLead(stored);body.command.owner=stored.owner_id||actor.id;}
    if(body.command.type==='agent.assignment.result')throw new OperationError('Agent send results are recorded by the agent service, not the client.',400);
    const original = await readState();
    verifyRevision(original.revision, body.revision);
    const result = applyCommand(original, body.command, actor);
    await writeState(result.state, body.revision);
    return Response.json({ state: visibleState(result.state, actor), resultId: result.resultId }, { headers });
}
catch (e) {
    return errorResponse(e);
} }
