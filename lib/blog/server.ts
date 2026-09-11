import 'server-only';
import {readFile,writeFile,mkdir,rename,open,unlink} from 'node:fs/promises';
import path from 'node:path';
import {mode,configured} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {isUuid} from '@/lib/operations/security.mjs';
import {mutateBlog,published,type BlogState} from './model';
const file=()=>path.join(process.cwd(),'.local-data','blog.json');
async function database(query:string,init:RequestInit={}){
 if(!configured())throw new OperationError('Blog storage requires LayeredFX server configuration.',503);
 const org=process.env.LFX_OPERATIONS_ORG_ID!;if(!isUuid(org))throw new OperationError('Invalid LayeredFX organization configuration.',503);
 const response=await fetch(`${process.env.LFX_SUPABASE_URL}/rest/v1/lfx_blog_store?org_id=eq.${org}${query}`,{...init,headers:{apikey:process.env.LFX_SUPABASE_SERVICE_ROLE_KEY!,Authorization:`Bearer ${process.env.LFX_SUPABASE_SERVICE_ROLE_KEY!}`,'Content-Type':'application/json',...init.headers},cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new OperationError('Blog storage is unavailable. Verify the reviewed blog schema and server configuration.',503);return response;
}
export async function readBlog():Promise<BlogState>{
 if(mode()==='demo'){try{return JSON.parse(await readFile(file(),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {revision:0,items:[]};throw e;}}
 const rows=await (await database('&select=revision,items')).json();return rows[0]||{revision:0,items:[]};
}
export async function publicPosts(){if(mode()!=='demo'&&!configured())return [];return published((await readBlog()).items);}
export async function saveBlog(method:string,body:Record<string,unknown>){
 let lock:Awaited<ReturnType<typeof open>>|undefined;
 if(mode()==='demo'){await mkdir(path.dirname(file()),{recursive:true});try{lock=await open(file()+'.lock','wx');}catch{throw new OperationError('Another save is in progress. Try again.',409);}}
 try{const current=await readBlog(),result=mutateBlog(current,method,body);
  if(mode()==='demo'){const temp=file()+'.tmp';await writeFile(temp,JSON.stringify(result.state),'utf8');await rename(temp,file());}
  else{
   if(current.revision===0){await database('&on_conflict=org_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},body:JSON.stringify({org_id:process.env.LFX_OPERATIONS_ORG_ID,revision:0,items:[]})});}
   const rows=await (await database(`&revision=eq.${current.revision}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(result.state)})).json();if(!rows.length)throw new OperationError('Another editor saved changes. Reload before saving again.',409);
  }return {item:result.item,revision:result.state.revision};
 }finally{if(lock){await lock.close();await unlink(file()+'.lock');}}
}
