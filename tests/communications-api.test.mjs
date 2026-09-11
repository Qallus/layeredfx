import test from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import {readFileSync} from 'node:fs';
const moduleUrl=source=>`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const engine=new URL('../lib/operations/engine.mjs',import.meta.url).href;
const boundary=moduleUrl(`
import {OperationError} from '${engine}';
export const fixture={signedIn:true,role:'staff',sent:[],listed:[]};
export async function currentActor(){if(!fixture.signedIn)throw new OperationError('Sign in required',401);return {id:'staff',role:fixture.role};}
export function checkOrigin(request){if(request.headers.get('origin')!=='https://layeredfx.com')throw new OperationError('Origin denied',403);}
export function errorResponse(error){return Response.json({message:error.message},{status:error.status||500});}
export function capabilities(){return {sms:true,voice:true,from:'+14805550123'};}
export function phone(v){if(typeof v!=='string'||!/^\\+[1-9]\\d{7,14}$/.test(v))throw new OperationError('Invalid phone');return v;}
export function twilioConfig(){return {from:'+14805550123'};}
export function twilioClient(){return {messages:{create:async input=>{fixture.sent.push(input);return {sid:'SMtest',status:'queued',secret:'not for clients'};},list:async input=>{fixture.listed.push(input);return [];}},calls:{list:async input=>{fixture.listed.push(input);return [];}}};}
export function voiceToken(){return 'test-token';}export function throttle(){}export function providerFailure(error){return error;}
`);
const{fixture}=await import(boundary);let code=ts.transpileModule(readFileSync(new URL('../app/api/communications/[action]/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
code=code.replaceAll('@/lib/operations/server',boundary).replaceAll('@/lib/operations/engine.mjs',engine).replaceAll('@/lib/operations/security.mjs',new URL('../lib/operations/security.mjs',import.meta.url).href).replaceAll('@/lib/communications/twilio',boundary);const api=await import(moduleUrl(code));
const send=(method,action,body={},origin='https://layeredfx.com')=>api[method](new Request(`https://layeredfx.com/api/communications/${action}`,{method,headers:{origin,'content-type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify(body)})}),{params:Promise.resolve({action})});
test.beforeEach(()=>Object.assign(fixture,{signedIn:true,role:'staff',sent:[],listed:[]}));
test('Twilio endpoints authenticate reads and token/SMS writes',async()=>{fixture.signedIn=false;for(const[method,action]of [['GET','calls'],['GET','capabilities'],['POST','token'],['POST','sms']])assert.equal((await send(method,action)).status,401);assert.equal(fixture.sent.length,0);});
test('viewer and cross-origin sends are forbidden',async()=>{fixture.role='viewer';assert.equal((await send('POST','sms')).status,403);fixture.role='staff';assert.equal((await send('POST','sms',{},'https://evil.example')).status,403);assert.equal(fixture.sent.length,0);});
test('Twilio write bodies are bounded before sending',async()=>{assert.equal((await send('POST','sms',{body:'x'.repeat(13000)})).status,413);assert.equal(fixture.sent.length,0);});
test('SMS uses the fixed LayeredFX sender and reports queued status without secrets',async()=>{const response=await send('POST','sms',{to:'+14805550999',from:'+19999999999',body:'Hello'});assert.equal(response.status,201);assert.equal(fixture.sent[0].from,'+14805550123');const payload=await response.json();assert.equal(payload.status,'queued');assert.equal(payload.secret,undefined);assert.match(payload.message,/not yet confirmed/);});
test('call history is restricted to the configured LayeredFX number',async()=>{assert.equal((await send('GET','calls')).status,200);assert.deepEqual(fixture.listed[0],{from:'+14805550123',limit:50});});
test('invalid destinations and unknown actions never send',async()=>{assert.equal((await send('POST','sms',{to:'javascript:alert(1)',body:'Hello'})).status,400);assert.equal((await send('POST','other')).status,404);assert.equal(fixture.sent.length,0);});
