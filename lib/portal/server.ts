import 'server-only';
import {cookies} from 'next/headers';
import {createClient} from '@supabase/supabase-js';
import {OperationError} from '@/lib/operations/engine.mjs';
import {isUuid} from '@/lib/operations/security.mjs';
import type {PortalAccount} from './model';
export const portalDemo=()=>process.env.NODE_ENV==='development'&&process.env.LFX_PORTAL_MODE!=='supabase';
export function portalConfig(){const url=process.env.LFX_SUPABASE_URL,anon=process.env.LFX_SUPABASE_ANON_KEY,key=process.env.LFX_SUPABASE_SERVICE_ROLE_KEY,org=process.env.LFX_OPERATIONS_ORG_ID;
 if(!url||!anon||!key||!org||!isUuid(org))throw new OperationError('Portal accounts are not connected yet. Please try again after setup.',503);
 if(process.env.NODE_ENV==='production'&&!url.startsWith('https://'))throw new OperationError('Portal connection requires HTTPS.',503);
 return{url,anon,key,org};}
export function portalClient(service=false){const c=portalConfig();return createClient(c.url,service?c.key:c.anon,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}
export async function portalAccount(userId:string):Promise<PortalAccount>{const c=portalConfig();const{data,error}=await portalClient(true).from('lfx_portal_accounts').select('*').eq('org_id',c.org).eq('user_id',userId).single();if(error||!data)throw new OperationError('Portal access has not been set up for this account.',403);return data;}
export async function verifiedPortal(token:string){const{data,error}=await portalClient().auth.getUser(token);if(error||!data.user?.email_confirmed_at)throw new OperationError('Sign in with a verified email address.',401);const account=await portalAccount(data.user.id);if(account.status==='suspended')throw new OperationError('Portal access is suspended. Contact LayeredFX.',403);return account;}
export async function currentPortal(){const token=(await cookies()).get('lfx_portal_access')?.value;if(!token)throw new OperationError('Sign in required.',401);return verifiedPortal(token);}
export async function portalCookies(session:{access_token:string;refresh_token:string;expires_in:number}){const jar=await cookies();const options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};jar.set('lfx_portal_access',session.access_token,{...options,maxAge:Math.min(session.expires_in,3600)});jar.set('lfx_portal_refresh',session.refresh_token,{...options,maxAge:7*86400});}
export async function savePortal(next:PortalAccount,revision:number){const{data,error}=await portalClient(true).from('lfx_portal_accounts').update({state:next.state,status:next.status,revision:next.revision,updated_at:new Date().toISOString()}).eq('org_id',next.org_id).eq('user_id',next.user_id).eq('revision',revision).select('user_id');if(error)throw new OperationError('Could not save portal changes.',503);if(!data?.length)throw new OperationError('This account changed in another window. Reload before retrying.',409);}
