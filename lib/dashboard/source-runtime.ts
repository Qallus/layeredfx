"use client";
import type {Actor,OperationState} from '@/lib/operations/types';
import type {AdminDashboardData,AdminProfile} from '@/ctrlp/lib/admin/types';
type Runtime={actor:Actor;state:OperationState;mode:'demo'|'supabase'};
let runtime:Runtime|null=null;
export function setSourceRuntime(next:Runtime){if(typeof window!=='undefined')runtime=next;}
export function getSourceRuntime(){if(!runtime)throw new Error('The LayeredFX dashboard session is not ready.');return runtime;}
export function sourceProfile():AdminProfile {
 const {actor}=getSourceRuntime();
 return {id:actor.id,full_name:actor.name,email:actor.email||'',role:actor.role==='admin'?'super_admin':actor.role==='staff'?'staff':'customer',status:'active',deleted_at:null};
}
export function sourceDashboardData():AdminDashboardData {
 const {state}=getSourceRuntime();
 // Canonical identities come from the existing provider; no source-company sample records.
 const users=[...state.people.map(p=>({id:p.id,email:p.email||'',full_name:p.name,phone:null,company:null,role:p.role==='admin'?'super_admin':p.role==='staff'?'staff':'viewer',status:'active',created_at:'',last_login_at:null,deleted_at:null})),...state.contacts.map(c=>({id:c.id,email:c.email,full_name:c.name,phone:c.phone,company:c.company,role:'customer',status:'active',created_at:'',last_login_at:null,deleted_at:null}))];
 return {orders:[],orderItems:[],productionJobs:[],artworkFiles:[],proofs:[],designDrafts:[],shipments:[],payments:[],messages:[],users,activityLogs:[],products:[]} as AdminDashboardData;
}
export async function sourceFetch(input:RequestInfo|URL,init?:RequestInit):Promise<Response>{
 const {mode}=getSourceRuntime();
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,window.location.origin);
 const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
 if(url.origin!==window.location.origin)return Response.json({error:'External requests require a configured LayeredFX provider.',message:'External requests require a configured LayeredFX provider.'},{status:503});
 if(url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/api/ctrlp/'))url.pathname=url.pathname.replace('/api/','/api/ctrlp/');
 if(mode==='demo'&&method!=='GET')throw new Error('This action requires the LayeredFX database integration. No changes were saved or sent.');
 if(mode==='demo'&&method==='GET'){
  const data=sourceDashboardData();
  if(url.pathname==='/api/ctrlp/cmi/contacts')return Response.json(getSourceRuntime().state.contacts.map(c=>({id:c.id,first_name:c.name,last_name:'',company:c.company,phone:c.phone,type:'Client'})));
  if(url.pathname==='/api/ctrlp/cmi/staff-options')return Response.json({staff:getSourceRuntime().state.people.filter(p=>p.role!=='viewer').map(p=>({id:p.id,label:p.name,role:p.role}))});
  if(url.pathname.includes('/dashboard/customer'))return Response.json({profile:{...sourceProfile(),phone:'',company:'',profile_photo_url:''}});
  return Response.json({...data,designers:[],installers:[],bookings:[],appointments:[],appointmentTypes:[],appointment_types:[],availabilityRules:[],blockedTimes:[],dependencies:[],participants:[],vendors:[],attachments:[],materials:[],events:[],staff:[],availability:[],conversations:[],calls:[],contacts:data.users,submissions:[],campaigns:[],posts:[],items:[],content:[],designs:[],rules:[],templates:[],notifications:[],unreadCount:0,accounts:[],settings:{},config:null,configured:false,enabled:false,schedule:[],groups:[],workflows:[],tasks:[],invoices:[],paymentMethods:[],balances:[],success:false,configurationRequired:true});
 }
 return fetch(url,{...init,credentials:'same-origin',cache:'no-store'});
}
