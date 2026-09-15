import test from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import {readFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';
const moduleUrl=source=>`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const engine=new URL('../lib/operations/engine.mjs',import.meta.url).href;
const boundary=moduleUrl(`
import {OperationError} from '${engine}';
export const fixture={mode:'supabase',configured:true,signedIn:true,email:'staff@example.com',password:'correct horse battery',updates:[],verified:[]};
export function checkOrigin(request){if(request.headers.get('origin')!=='https://layeredfx.com')throw new OperationError('Origin denied',403);}
export async function currentActor(){if(!fixture.signedIn)throw new OperationError('Sign in required.',401);return {id:'staff_1',name:'Staff',role:'staff',email:fixture.email};}
export const mode=()=>fixture.mode;export const configured=()=>fixture.configured;
export function errorResponse(error){return Response.json({message:error.message},{status:error.status||500});}
export async function authTokens(grant,body){fixture.verified.push({grant,email:body.email});if(body.password!==fixture.password)throw new OperationError('Sign-in failed.',401);return {access_token:'fresh',refresh_token:'r',expires_in:3600};}
export async function currentAccessToken(){return 'session-token';}
export async function updatePassword(token,password){fixture.updates.push({token,password});}
`);
const {fixture}=await import(boundary);
let code=ts.transpileModule(readFileSync(new URL('../app/api/operations/auth/password/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
code=code.replaceAll('@/lib/operations/server',boundary).replaceAll('@/lib/operations/engine.mjs',engine).replaceAll('@/lib/operations/security.mjs',new URL('../lib/operations/security.mjs',import.meta.url).href);
// Each test gets a fresh module so the attempt counter starts empty.
const freshRoute=()=>import(moduleUrl(`${code}\n// ${randomUUID()}`));
const post=(api,body,origin='https://layeredfx.com')=>api.POST(new Request('https://layeredfx.com/api/operations/auth/password',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}));
const good={currentPassword:'correct horse battery',newPassword:'a much longer passphrase'};
test.beforeEach(()=>Object.assign(fixture,{mode:'supabase',configured:true,signedIn:true,email:'staff@example.com',updates:[],verified:[]}));

test('password changes need the live sign-in service, the LayeredFX origin and a session',async()=>{
  const api=await freshRoute();
  fixture.mode='demo';assert.equal((await post(api,good)).status,503);
  fixture.mode='supabase';fixture.configured=false;assert.equal((await post(api,good)).status,503);
  fixture.configured=true;assert.equal((await post(api,good,'https://evil.example')).status,403);
  fixture.signedIn=false;assert.equal((await post(api,good)).status,401);
  assert.equal(fixture.updates.length,0);
});

test('the new password is validated and the current password verified before anything changes',async()=>{
  const api=await freshRoute();
  assert.equal((await post(api,{...good,newPassword:'short'})).status,400);
  assert.equal((await post(api,{...good,newPassword:good.currentPassword})).status,400);
  const wrong=await post(api,{...good,currentPassword:'a wrong guess'});
  assert.equal(wrong.status,400);assert.match((await wrong.json()).message,/incorrect/);
  assert.equal(fixture.updates.length,0);
  const ok=await post(api,good);
  assert.equal(ok.status,200);
  assert.deepEqual(fixture.updates,[{token:'session-token',password:good.newPassword}]);
  assert.deepEqual(fixture.verified.at(-1),{grant:'password',email:'staff@example.com'});
});

test('repeated attempts are throttled per member',async()=>{
  const api=await freshRoute();
  for(let i=0;i<5;i++)assert.equal((await post(api,{...good,currentPassword:'a wrong guess'})).status,400);
  assert.equal((await post(api,good)).status,429);
  assert.equal(fixture.updates.length,0);
});
