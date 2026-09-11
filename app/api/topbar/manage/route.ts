import {checkOrigin,currentActor,errorResponse,mode} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {readBody} from '@/lib/operations/security.mjs';
import {readNotices,saveNotice} from '@/lib/topbar/server';
async function access(request:Request){if(request.method!=='GET')checkOrigin(request);if(mode()!=='demo'){const actor=await currentActor();if(actor.role!=='admin')throw new OperationError('Only administrators can manage top bar notifications.',403);}}
export async function GET(request:Request){try{await access(request);return Response.json(await readNotices(),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return errorResponse(e);}}
async function write(request:Request){try{await access(request);let body;try{body=JSON.parse(await readBody(request,64000));}catch(e){if(e instanceof OperationError)throw e;throw new OperationError('Invalid JSON.',400);}if(!body||typeof body!=='object')throw new OperationError('Invalid post.',400);return Response.json(await saveNotice(request.method,body),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return errorResponse(e);}}
export const POST=write;export const PATCH=write;export const DELETE=write;
