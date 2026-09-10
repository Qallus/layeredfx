import { OperationError } from '@/lib/operations/engine.mjs';
import { readBody } from '@/lib/operations/security.mjs';
import { checkOrigin,currentActor,errorResponse } from '@/lib/operations/server';
export const dynamic='force-dynamic';
async function handle(request:Request){
 try{
  if(request.method!=='GET')checkOrigin(request);
  const actor=await currentActor();
  if(request.method!=='GET'&&actor.role==='viewer')throw new OperationError('This account is read-only.',403);
  if(request.method!=='GET')await readBody(request,512000);
  return Response.json({error:'This dashboard workflow is awaiting LayeredFX database/provider integration. No action was performed.',message:'This dashboard workflow is awaiting LayeredFX database/provider integration. No action was performed.',configurationRequired:true},{status:503,headers:{'Cache-Control':'private, no-store'}});
 }catch(error){return errorResponse(error);}
}
export const GET=handle;export const POST=handle;export const PATCH=handle;export const PUT=handle;export const DELETE=handle;
