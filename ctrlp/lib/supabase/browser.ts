"use client";
import { getSourceRuntime,sourceDashboardData,sourceProfile } from '@/lib/dashboard/source-runtime';
import { createClient,type Session } from '@supabase/supabase-js';

// A compatibility facade for source UI. It never connects a browser to Supabase data.
const client=createClient('https://layeredfx.invalid','layeredfx-cookie-session',{
 auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
 global:{fetch:async(input,init)=>{
  const {mode}=getSourceRuntime();
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
  if(mode==='demo'&&(!init?.method||init.method==='GET')&&url.pathname.startsWith('/rest/v1/')){
   const table=url.pathname.split('/').at(-1);
   const data=sourceDashboardData();
   const rows=table==='users'?data.users:[];
   const single=String(new Headers(init?.headers).get('accept')).includes('object');
   return Response.json(single?rows.find(row=>`eq.${row.id}`===url.searchParams.get('id'))||null:rows);
  }
  return Response.json({message:'LayeredFX database and storage setup is required. No change was saved.',error:'LayeredFX database and storage setup is required. No change was saved.'},{status:503});
 }},
});
client.auth.getSession=async()=>{
 const profile=sourceProfile();
 const session:Session={access_token:'layeredfx-cookie-session',refresh_token:'',token_type:'bearer',expires_in:3600,user:{id:profile.id,email:profile.email||'',app_metadata:{},user_metadata:{},aud:'authenticated',created_at:''}};
 return {data:{session},error:null};
};
client.auth.signOut=async()=>{await fetch('/api/operations/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});return {error:null};};
export function getSupabaseBrowserClient(){return client;}
