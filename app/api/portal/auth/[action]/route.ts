import {cookies} from 'next/headers';
import {checkOrigin,errorResponse} from '@/lib/operations/server';
import {readBody} from '@/lib/operations/security.mjs';
import {OperationError} from '@/lib/operations/engine.mjs';
import {portalClient,portalCookies,portalConfig,verifiedPortal} from '@/lib/portal/server';
import {accountTypes,initialPortal,isPartner,portalText} from '@/lib/portal/model';
function passwordText(value:unknown){if(typeof value!=='string'||value.length>1024)throw new OperationError('Enter a valid password.',400);return value;}
const attempts=new Map<string,{count:number;at:number}>();
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){try{
 checkOrigin(request);const{action}=await params;const body=JSON.parse(await readBody(request,12000));
 if(action==='logout'){const jar=await cookies();const token=jar.get('lfx_portal_access')?.value;if(token)await portalClient(true).auth.admin.signOut(token,'local');jar.delete('lfx_portal_access');jar.delete('lfx_portal_refresh');return Response.json({ok:true});}
 const client=portalClient();
 if(action==='refresh'){const refresh_token=(await cookies()).get('lfx_portal_refresh')?.value;if(!refresh_token)throw new OperationError('Sign in required.',401);const{data,error}=await client.auth.refreshSession({refresh_token});if(error||!data.session)throw new OperationError('Sign in again.',401);const account=await verifiedPortal(data.session.access_token);await portalCookies(data.session);return Response.json({destination:isPartner(account.kind)?'/partner':'/portal'});}
 const email=portalText(body.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new OperationError('Enter a valid email.',400);
 const rate=attempts.get(email);if(rate&&Date.now()-rate.at<60000&&rate.count>=8)throw new OperationError('Please wait a minute before trying again.',429);if(attempts.size>10000)attempts.clear();attempts.set(email,{count:rate&&Date.now()-rate.at<60000?rate.count+1:1,at:rate&&Date.now()-rate.at<60000?rate.at:Date.now()});
 if(action==='register'){
  const name=portalText(body.name,150),password=passwordText(body.password),kind=body.kind;if(!name||password.length<12||!accountTypes.includes(kind))throw new OperationError('Complete your details and use a password of at least 12 characters.',400);
  const{data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:new URL('/login',process.env.NEXT_PUBLIC_SITE_URL||'https://layeredfx.com').href}});
  if(error)throw new OperationError('Registration could not be completed. Please try again.',400);
  if(data.user&&data.user.identities?.length){const{error:dbError}=await portalClient(true).from('lfx_portal_accounts').upsert({user_id:data.user.id,org_id:portalConfig().org,email,kind,status:isPartner(kind)?'pending':'active',revision:0,state:initialPortal(name)},{onConflict:'org_id,user_id',ignoreDuplicates:true});if(dbError)throw new OperationError('Account created but portal setup is incomplete. Contact LayeredFX before retrying.',503);}
  return Response.json({message:'Check your email to verify your account, then sign in. Partner access requires team approval.'});
 }
 if(action!=='login')throw new OperationError('Unknown action.',404);
 const{data,error}=await client.auth.signInWithPassword({email,password:passwordText(body.password)});if(error||!data.session)throw new OperationError('Sign-in failed. Check your email and password.',401);
 const account=await verifiedPortal(data.session.access_token);await portalCookies(data.session);return Response.json({destination:isPartner(account.kind)?'/partner':'/portal'});
 }catch(e){return errorResponse(e instanceof SyntaxError?new OperationError('Invalid request.',400):e);}}
