import { applyCommand, visibleState, OperationError } from '@/lib/operations/engine.mjs';
import { parseCommandBody, verifyRevision, readBody } from '@/lib/operations/security.mjs';
import { currentActor, readState, writeState, checkOrigin, errorResponse } from '@/lib/operations/server';
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
    const original = await readState();
    verifyRevision(original.revision, body.revision);
    const result = applyCommand(original, body.command, actor);
    await writeState(result.state, body.revision);
    return Response.json({ state: visibleState(result.state, actor), resultId: result.resultId }, { headers });
}
catch (e) {
    return errorResponse(e);
} }
