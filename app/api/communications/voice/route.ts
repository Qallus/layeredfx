import twilio from 'twilio';
import {people,errorResponse} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {phone,twilioConfig,voiceIdentity,providerFailure} from '@/lib/communications/twilio';
export const dynamic='force-dynamic';
// Provider webhook exception: Twilio signature plus an active LayeredFX voice identity,
// not browser cookies. No state or voice operation is accepted from unsigned requests.
export async function POST(request:Request){try{
 const expected=process.env.LFX_TWILIO_VOICE_WEBHOOK_URL;if(!expected||!expected.startsWith('https://'))throw new OperationError('Voice webhook is not configured.',503);
 if(!request.headers.get('content-type')?.includes('application/x-www-form-urlencoded'))throw new OperationError('Form data is required.',415);
 const reader=request.body?.getReader();let size=0;const chunks:Uint8Array[]=[];if(reader){try{while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();throw new OperationError('Request too large.',413);}chunks.push(value);}}finally{reader.releaseLock();}}
 const data=Buffer.concat(chunks);const params=Object.fromEntries(new URLSearchParams(data.toString('utf8')));const config=twilioConfig();
 if(!twilio.validateRequest(config.secret,request.headers.get('x-twilio-signature')||'',expected,params)||params.AccountSid!==config.sid)throw new OperationError('Invalid provider signature.',403);
 const member=(await people()).find(p=>`client:${voiceIdentity(p)}`===params.From);if(!member||member.role==='viewer')throw new OperationError('Active staff membership is required.',403);
 const response=new twilio.twiml.VoiceResponse();response.dial({callerId:config.from,timeout:30,record:'do-not-record'}).number(phone(params.To));
 return new Response(response.toString(),{headers:{'Content-Type':'text/xml','Cache-Control':'no-store'}});
 }catch(e){return errorResponse(providerFailure(e));}}
