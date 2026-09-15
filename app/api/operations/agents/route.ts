import {currentActor,errorResponse} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {agentConnections} from '@/lib/agents/connections';
export const dynamic='force-dynamic';
// Variable names and https origins only. Keys and secrets never leave the server.
export async function GET(){try{
 const actor=await currentActor();if(actor.role==='viewer')throw new OperationError('Agent setup requires staff access.',403);
 return Response.json({connections:agentConnections(),verified:false},{headers:{'Cache-Control':'private, no-store',Vary:'Cookie'}});
}catch(e){return errorResponse(e);}}
