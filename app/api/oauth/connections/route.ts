// The signed-in member's Claude/MCP connections, and disconnecting one (which revokes every token it holds).
import {OperationError} from '@/lib/operations/engine.mjs';
import {checkOrigin, currentActor, errorResponse, mode} from '@/lib/operations/server';
import {listConnections, revokeFamily} from '@/lib/mcp/store';
import type {Actor} from '@/lib/operations/types';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'private, no-store', Vary: 'Cookie'};
const me = async (): Promise<Actor> => mode() === 'demo' ? {id: 'demo_owner', name: 'Demo Owner', role: 'admin'} : currentActor();

export async function GET() {
  try { return Response.json({connections: await listConnections((await me()).id)}, {headers}); } catch (e) { return errorResponse(e); }
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const actor = await me();
    const family = new URL(request.url).searchParams.get('id') || '';
    if (!/^[0-9a-f-]{36}$/.test(family)) throw new OperationError('Choose a connection to disconnect.', 400);
    await revokeFamily(family, actor.id);
    return Response.json({disconnected: true}, {headers});
  } catch (e) { return errorResponse(e); }
}
