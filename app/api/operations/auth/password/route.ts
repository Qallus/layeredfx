// Staff password change. The current password is verified with the LayeredFX sign-in service before the new one is set.
import {authTokens,checkOrigin,configured,currentAccessToken,currentActor,errorResponse,mode,updatePassword} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {readBody} from '@/lib/operations/security.mjs';

export const dynamic='force-dynamic';
const WINDOW_MS=15*60*1000,MAX_ATTEMPTS=5;
const attempts=new Map<string,{start:number;count:number}>();

export async function POST(request:Request){try{
 checkOrigin(request);
 if(mode()==='demo'||!configured())throw new OperationError('Password changes need the LayeredFX sign-in service. Nothing was changed.',503);
 const actor=await currentActor();
 const now=Date.now(),bucket=attempts.get(actor.id),recent=bucket&&now-bucket.start<WINDOW_MS;
 if(recent&&bucket.count>=MAX_ATTEMPTS)throw new OperationError('Too many password attempts. Wait a few minutes and try again.',429);
 attempts.set(actor.id,recent?{start:bucket.start,count:bucket.count+1}:{start:now,count:1});
 let body:Record<string,unknown>;
 try{const parsed:unknown=JSON.parse(await readBody(request,4000));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error();body=parsed as Record<string,unknown>;}
 catch(e){if(e instanceof OperationError)throw e;throw new OperationError('Invalid request.');}
 const current=typeof body.currentPassword==='string'?body.currentPassword:'';
 const next=typeof body.newPassword==='string'?body.newPassword:'';
 if(!current)throw new OperationError('Enter your current password.');
 if(next.length<12||next.length>128)throw new OperationError('Use a new password of 12 to 128 characters.');
 if(next===current)throw new OperationError('Choose a new password that is different from your current one.');
 if(!actor.email)throw new OperationError('This account has no sign-in email. Ask a LayeredFX administrator for help.');
 try{await authTokens('password',{email:actor.email,password:current});}
 catch{throw new OperationError('Your current password is incorrect.');}
 await updatePassword(await currentAccessToken(),next);
 return Response.json({message:'Password updated. Use it the next time you sign in.'},{headers:{'Cache-Control':'private, no-store'}});
}catch(e){return errorResponse(e);}}
