import {spawn} from 'node:child_process';
import {writeFileSync,existsSync,cpSync} from 'node:fs';
// Match the Dockerfile's standalone asset layout in generated build output only.
cpSync('public','.next/standalone/public',{recursive:true});
cpSync('.next/static','.next/standalone/.next/static',{recursive:true});
const output=[];
const server=spawn(process.execPath,['.next/standalone/server.js'],{
 env:{...process.env,NODE_ENV:'production',HOSTNAME:'127.0.0.1',PORT:'3001',LFX_OPERATIONS_MODE:'demo',LFX_SUPABASE_URL:'',LFX_SUPABASE_ANON_KEY:'',LFX_SUPABASE_SERVICE_ROLE_KEY:'',LFX_OPERATIONS_ORG_ID:''},stdio:['ignore','pipe','pipe'],windowsHide:true,
});
server.stdout.on('data',b=>output.push(b.toString()));server.stderr.on('data',b=>output.push(b.toString()));
const results=[];
try {
 for(let attempt=0;attempt<40;attempt++){
  try{if((await fetch('http://127.0.0.1:3001/api/health')).ok)break;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 for(const path of ['/','/images/kitchen.svg','/admin','/admin/coupons','/admin/orders','/admin/jobs','/admin/contacts','/admin/leads','/api/admin/coupons','/api/operations','/api/ctrlp/admin/orders','/api/ctrlp/cmi/jobs','/api/communications/capabilities','/api/communications/calls','/login','/register','/api/portal','/api/portal/media','/api/portal/staff']) {
  const response=await fetch('http://127.0.0.1:3001'+path);const body=await response.text();
  const expected=path.startsWith('/api/')?401:200;
  if(response.status!==expected)throw new Error(`${path}: ${response.status}, expected ${expected}`);
  if(path.startsWith('/admin')&&!body.includes('Operations is not configured'))throw new Error('Production configuration gate missing');
  if(path.startsWith('/admin')&&body.includes('LOCAL DEMO'))throw new Error('Production demo bypass');
  results.push({path,status:response.status,passed:true});
 }
 for(const path of ['/portal','/partner']){const res=await fetch('http://127.0.0.1:3001'+path,{redirect:'manual'});if(res.status!==307||res.headers.get('location')!=='/login')throw new Error('Production portal access bypass');results.push({path,status:res.status,passed:true});}
 results.push({name:'Standalone entry point generated',passed:existsSync('.next/standalone/server.js')});
 for(const action of ['token','sms']){const response=await fetch('http://127.0.0.1:3001/api/communications/'+action,{method:'POST',headers:{Origin:'https://layeredfx.com','Content-Type':'application/json'},body:'{}'});if(response.status!==401)throw new Error(`Anonymous ${action} returned ${response.status}`);results.push({path:'/api/communications/'+action,method:'POST',status:response.status,passed:true});}
 if(!existsSync('.next/standalone/server.js'))throw new Error('Standalone output missing');
 console.log(JSON.stringify(results,null,2));
}finally{
 const stopped=new Promise(resolve=>server.once('close',resolve));
 server.kill();await stopped;
 writeFileSync('docs/reviews/logs/production-smoke.json',JSON.stringify(results,null,2)+'\n');
 writeFileSync('docs/reviews/logs/production-server.txt',output.join(''));
}
