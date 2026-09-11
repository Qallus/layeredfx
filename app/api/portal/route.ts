import {currentPortal,savePortal} from '@/lib/portal/server';
import {checkOrigin,errorResponse} from '@/lib/operations/server';
import {readBody} from '@/lib/operations/security.mjs';
import {portalCommand} from '@/lib/portal/model';
import {OperationError} from '@/lib/operations/engine.mjs';
export async function GET(){try{return Response.json(await currentPortal(),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{checkOrigin(request);const account=await currentPortal();const body=JSON.parse(await readBody(request,16000));if(body.revision!==account.revision)throw new OperationError('Reload the latest account before saving.',409);let next;try{next=portalCommand(account,body.command);}catch(e){throw new OperationError(e instanceof Error?e.message:'Invalid request.',400);}await savePortal(next,account.revision);return Response.json(next,{headers:{'Cache-Control':'private, no-store'}});}catch(e){return errorResponse(e);}}
