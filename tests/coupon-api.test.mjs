import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const asModule=code=>`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const compile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const domain=asModule(compile('../lib/admin/coupons.ts'));
// Replace external auth/database boundaries only, then execute the actual route handlers.
const fixtures=asModule(`
 export const fixture={role:'staff', signedIn:true, row:null, conflict:false, reads:0, writes:0, verified:0};
 export async function currentActor(){fixture.verified++;if(!fixture.signedIn)throw Object.assign(new Error('Sign in required'),{status:401});return {id:'member',role:fixture.role};}
 export function checkOrigin(r){if(r.headers.get('origin')!=='https://layeredfx.com')throw Object.assign(new Error('Origin denied'),{status:403});}
 export function errorResponse(e){return Response.json({message:e.message},{status:e.status||500});}
 export function couponRepository(){return {
 list:async()=>{fixture.reads++;return fixture.row?[fixture.row]:[]},get:async()=>fixture.row,
 create:async(data)=>{fixture.writes++;return {...data,id:'new',revision:0}},
 update:async(id,rev,data)=>{if(fixture.conflict)throw Object.assign(new Error('Conflict'),{status:409});fixture.writes++;return {...data,id,revision:rev+1}},
 remove:async()=>{fixture.writes++}
 };}
`);
const {fixture}=await import(fixtures);
let route=compile('../app/api/admin/coupons/route.ts');
route=route.replaceAll('@/lib/operations/server',fixtures).replaceAll('@/lib/admin/coupon-repository',fixtures).replaceAll('@/lib/admin/coupons',domain).replaceAll('@/lib/operations/security.mjs',new URL('../lib/operations/security.mjs',import.meta.url).href);
const api=await import(asModule(route));
const valid={code:'SAVE',discount_type:'percentage',discount_value:10,active:true};
const send=(method,body,origin='https://layeredfx.com')=>api[method](new Request('https://layeredfx.com/api/admin/coupons',{method,headers:{origin,'content-type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify(body)})}));
test.beforeEach(()=>Object.assign(fixture,{role:'staff',signedIn:true,row:null,conflict:false,reads:0,writes:0,verified:0}));
test('signed-out GET cannot load coupons',async()=>{fixture.signedIn=false;assert.equal((await send('GET')).status,401);assert.equal(fixture.reads,0)});
test('every mutation verifies membership and rejects viewers',async()=>{
 fixture.role='viewer';
 for(const method of ['POST','PATCH','DELETE'])assert.equal((await send(method,valid)).status,403);
 assert.equal(fixture.verified,3);assert.equal(fixture.writes,0);
});
test('cross-origin coupon mutation stops before storage',async()=>{assert.equal((await send('POST',valid,'https://other.example')).status,403);assert.equal(fixture.writes,0)});
test('bounded JSON rejects oversized streamed body',async()=>{assert.equal((await send('POST',{...valid,description:'a'.repeat(17000)})).status,413);assert.equal(fixture.writes,0)});
test('creation returns 201 only after repository success',async()=>{assert.equal((await send('POST',valid)).status,201);assert.equal(fixture.writes,1)});
test('stale coupon revision prevents updates and deletes',async()=>{
 fixture.row={...valid,id:'1',revision:2};
 for(const method of ['PATCH','DELETE'])assert.equal((await send(method,{id:'1',revision:1,active:false})).status,409);
 assert.equal(fixture.writes,0);
});
test('write-time compare-and-swap conflict remains a 409',async()=>{
 fixture.row={...valid,id:'1',revision:2};fixture.conflict=true;
 assert.equal((await send('PATCH',{id:'1',revision:2,active:false})).status,409);assert.equal(fixture.writes,0);
});
test('used coupons cannot be deleted',async()=>{fixture.row={...valid,id:'1',revision:2,uses_count:1};assert.equal((await send('DELETE',{id:'1',revision:2})).status,409);assert.equal(fixture.writes,0)});
test('PATCH cannot bypass the percentage cap',async()=>{fixture.row={...valid,id:'1',revision:2};assert.equal((await send('PATCH',{id:'1',revision:2,discount_value:200})).status,400);assert.equal(fixture.writes,0)});
