import {checkOrigin,currentActor,errorResponse} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {readBody} from '@/lib/operations/security.mjs';
import {capabilities,phone,providerFailure,throttle,twilioClient,twilioConfig,voiceToken} from '@/lib/communications/twilio';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store',Vary:'Cookie'};
type Context={params:Promise<{action:string}>};
export async function GET(request:Request,context:Context){try{
 const actor=await currentActor();const{action}=await context.params;
 if(action==='capabilities')return Response.json({...capabilities(),canSend:actor.role!=='viewer'},{headers});
 if(actor.role==='viewer')throw new OperationError('Communication history requires staff access.',403);
 const config=twilioConfig();const client=twilioClient();
 if(action==='calls'){const records=await client.calls.list({from:config.from,limit:50});return Response.json({calls:records.map(r=>({id:r.sid,from:r.from,to:r.to,status:r.status,direction:r.direction,duration:r.duration,at:r.dateCreated?.toISOString()}))},{headers});}
 if(action==='sms'){const to=phone(new URL(request.url).searchParams.get('to'));const records=await client.messages.list({from:config.from,to,limit:30});return Response.json({messages:records.map(r=>({id:r.sid,to:r.to,from:r.from,body:r.body,status:r.status,at:r.dateCreated?.toISOString()}))},{headers});}
 throw new OperationError('Unknown communication action.',404);
 }catch(e){return errorResponse(providerFailure(e));}}
export async function POST(request:Request,context:Context){try{
 checkOrigin(request);const actor=await currentActor();if(actor.role==='viewer')throw new OperationError('This account is read-only.',403);
 if(!request.headers.get('content-type')?.includes('application/json'))throw new OperationError('JSON is required.',415);
 const raw=await readBody(request,12000);let body:Record<string,unknown>;try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();}catch{throw new OperationError('Valid JSON object is required.');}const{action}=await context.params;throttle(actor);
 if(action==='token')return Response.json({token:voiceToken(actor)},{headers});
 if(action==='sms'){
  const to=phone(body.to);if(typeof body.body!=='string'||!body.body.trim()||body.body.length>1600)throw new OperationError('SMS must contain 1–1,600 characters.');
  const config=twilioConfig();const message=await twilioClient().messages.create({to,from:config.from,body:body.body.trim()});
  return Response.json({id:message.sid,status:message.status,message:'Accepted by Twilio. Delivery is not yet confirmed.'},{status:201,headers});
 }
 throw new OperationError('Unknown communication action.',404);
 }catch(e){return errorResponse(providerFailure(e));}}
