import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const moduleUrl=source=>`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const boundaries=moduleUrl(`
export const fixture={signedIn:true,role:'admin',checks:0};
export async function currentActor(){fixture.checks++;if(!fixture.signedIn)throw Object.assign(new Error('Sign in required'),{status:401});return {role:fixture.role};}
export function checkOrigin(request){if(request.headers.get('origin')!=='https://layeredfx.com')throw Object.assign(new Error('Origin denied'),{status:403});}
export function errorResponse(error){return Response.json({message:error.message},{status:error.status||500});}
`);
const {fixture}=await import(boundaries);
let source=ts.transpileModule(readFileSync(new URL('../app/api/ctrlp/[...path]/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
source=source.replaceAll('@/lib/operations/server',boundaries).replaceAll('@/lib/operations/engine.mjs',new URL('../lib/operations/engine.mjs',import.meta.url).href).replaceAll('@/lib/operations/security.mjs',new URL('../lib/operations/security.mjs',import.meta.url).href);
const api=await import(moduleUrl(source));
const send=(method,body={},origin='https://layeredfx.com')=>api[method](new Request('https://layeredfx.com/api/ctrlp/admin/orders',{method,headers:{origin,'content-type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify(body)})}));
test.beforeEach(()=>Object.assign(fixture,{signedIn:true,role:'admin',checks:0}));
test('every imported workflow method requires verified membership',async()=>{fixture.signedIn=false;for(const method of ['GET','POST','PATCH','PUT','DELETE'])assert.equal((await send(method)).status,401);assert.equal(fixture.checks,5);});
test('source workflow writes reject read-only members',async()=>{fixture.role='viewer';for(const method of ['POST','PATCH','PUT','DELETE'])assert.equal((await send(method)).status,403);});
test('source workflow writes enforce origin and bounded bodies',async()=>{assert.equal((await send('POST',{},'https://other.example')).status,403);assert.equal((await send('POST',{content:'x'.repeat(512001)})).status,413);});
test('unintegrated workflows never report a successful read or write',async()=>{for(const method of ['GET','POST','PATCH','PUT','DELETE']){const response=await send(method);assert.equal(response.status,503);assert.equal((await response.json()).configurationRequired,true);assert.equal(response.headers.get('cache-control'),'private, no-store');}});
