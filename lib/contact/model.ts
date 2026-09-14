import {OperationError} from '@/lib/operations/engine.mjs';
export const consentText='I agree to receive recurring automated SMS from LayeredFX about project updates, appointments, design news and offers. Message frequency varies. Message and data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out or HELP for help.';
export type IntakeFile={id:string;name:string;type:string;size:number;data?:string};
export type Intake={id:string;kind:'contact'|'opt-in'|'opt-out';createdAt:string;name:string;email:string;phone:string;company:string;service:string;message:string;sms:boolean;emailUpdates:boolean;consentText:string;policyVersion:string;files:IntakeFile[]};
const text=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n):'';
export function normalizeIntake(body:Record<string,unknown>):Intake{
 const kind=body.kind;if(!['contact','opt-in','opt-out'].includes(String(kind)))throw new OperationError('Invalid form.',400);
 const id=text(body.id,36);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw new OperationError('Invalid request identifier.',400);
 const email=text(body.email,200).toLowerCase(),phone=text(body.phone,40),name=text(body.name,150),message=text(body.message,5000),sms=body.sms===true,emailUpdates=body.emailUpdates===true;
 if(kind==='contact'&&(!name||!message||!email))throw new OperationError('Enter your name, email and message.',400);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new OperationError('Enter a valid email address.',400);
 if(kind!=='contact'&&!sms&&!emailUpdates)throw new OperationError('Choose SMS or email.',400);
 if((sms&&!/^\+?[\d ()-]{10,25}$/.test(phone))||(emailUpdates&&!email))throw new OperationError('Enter contact details for each selected channel.',400);
 const raw=Array.isArray(body.files)?body.files:[];if(raw.length>3||kind!=='contact'&&raw.length)throw new OperationError('Choose up to three files.',400);
 let total=0;const files=raw.map((f)=>{if(!f||typeof f!=='object')throw new OperationError('Invalid file.',400);const type=text(f.type,60),name=text(f.name,180).replace(/[\r\n\x00]/g,''),data=text(f.data,3000000);if(!/^[A-Za-z0-9+/]*={0,2}$/.test(data))throw new OperationError('Invalid file encoding.',400);const bytes=Buffer.from(data,'base64');total+=bytes.length;
 const valid=type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):type==='image/webp'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP':type==='application/pdf'?bytes.toString('ascii',0,5)==='%PDF-':false;
 if(!valid||!bytes.length||bytes.length>2*1024*1024||total>6*1024*1024)throw new OperationError('Use JPEG, PNG, WebP or PDF, up to 2 MB each.',400);return {id:crypto.randomUUID(),name,type,size:bytes.length,data};});
 return {id,kind:kind as Intake['kind'],createdAt:new Date().toISOString(),name,email,phone,company:text(body.company,200),service:text(body.service,100),message,sms,emailUpdates,consentText:kind==='opt-out'?'Stop selected marketing channels.':consentText,policyVersion:'2026-09-12',files};
}
export const metadata=(item:Intake):Intake=>({...item,files:item.files.map(({data:_,...file})=>file)});
