import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const asModule=code=>`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const compile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const engine=new URL('../lib/operations/engine.mjs',import.meta.url).href;
const model=asModule(compile('../lib/jobs/logs-model.ts').replace('@/lib/operations/engine.mjs',engine));
// Replace the auth and storage boundaries only, then run the real route handlers and validation.
const fixtures=asModule(`
 import {OperationError} from '${engine}';
 export const fixture={role:'staff',signedIn:true,created:[],updated:0,deleted:0};
 export async function logsActor(){if(!fixture.signedIn)throw new OperationError('Sign in required.',401);return {id:'member',name:'Member',role:fixture.role};}
 export function requireWriter(a){if(a.role==='viewer')throw new OperationError('Staff access required to add daily logs.',403);}
 export function checkOrigin(r){if(r.headers.get('origin')!=='https://layeredfx.com')throw new OperationError('Origin denied',403);}
 export function errorResponse(e){return Response.json({message:e.message},{status:e.status||500});}
 export async function listLogs(){return [];}
 export async function createLog(actor,draft,files){fixture.created.push({draft,files});return {id:'log',...draft,media:files.map(f=>({type:f.type,size:f.bytes.byteLength}))};}
 export async function updateLog(){fixture.updated++;return {};}
 export async function deleteLog(){fixture.deleted++;}
`);
const {fixture}=await import(fixtures);
const route=compile('../app/api/jobs/logs/route.ts').replaceAll('@/lib/operations/server',fixtures).replaceAll('@/lib/jobs/logs-server',fixtures).replaceAll('@/lib/jobs/logs-model',model).replaceAll('@/lib/operations/engine.mjs',engine).replaceAll('@/lib/operations/security.mjs',new URL('../lib/operations/security.mjs',import.meta.url).href);
const api=await import(asModule(route));
const JOB='job_12345678-1234-1234-1234-123456789abc';
function post(payload,files=[],origin='https://layeredfx.com'){const form=new FormData();form.set('payload',JSON.stringify(payload));for(const f of files)form.append('files',f);return api.POST(new Request('https://layeredfx.com/api/jobs/logs',{method:'POST',headers:{origin},body:form}));}
const jpeg=()=>new File([new Uint8Array([0xff,0xd8,0xff,0xe0,1,2,3])],'site.jpg',{type:'image/jpeg'});
test.beforeEach(()=>Object.assign(fixture,{role:'staff',signedIn:true,created:[],updated:0,deleted:0}));

test('signed-out members cannot list or add logs',async()=>{fixture.signedIn=false;assert.equal((await api.GET(new Request('https://layeredfx.com/api/jobs/logs'))).status,401);assert.equal((await post({jobId:JOB,kind:'photo',logDate:'2026-10-12'},[jpeg()])).status,401);assert.equal(fixture.created.length,0);});
test('read-only members can list but not add, edit or delete logs',async()=>{fixture.role='viewer';assert.equal((await api.GET(new Request('https://layeredfx.com/api/jobs/logs'))).status,200);assert.equal((await post({jobId:JOB,kind:'photo',logDate:'2026-10-12'},[jpeg()])).status,403);assert.equal((await api.DELETE(new Request('https://layeredfx.com/api/jobs/logs?id=x',{method:'DELETE',headers:{origin:'https://layeredfx.com'}}))).status,403);assert.equal(fixture.created.length+fixture.deleted,0);});
test('cross-site uploads are refused before reading the body',async()=>{assert.equal((await post({jobId:JOB,kind:'photo',logDate:'2026-10-12'},[jpeg()],'https://evil.example')).status,403);assert.equal(fixture.created.length,0);});
test('a photo log with a real JPEG is saved with its bytes',async()=>{const res=await post({jobId:JOB,kind:'photo',logDate:'2026-10-12',body:'Before'},[jpeg()]);assert.equal(res.status,201);assert.equal(fixture.created[0].files[0].bytes.byteLength,7);assert.equal(fixture.created[0].draft.body,'Before');});
test('a file whose bytes do not match its type is rejected',async()=>{const fake=new File(['<html>'],'x.jpg',{type:'image/jpeg'});const res=await post({jobId:JOB,kind:'photo',logDate:'2026-10-12'},[fake]);assert.equal(res.status,400);assert.match((await res.json()).message,/does not match/);assert.equal(fixture.created.length,0);});
test('a voice note needs exactly one recording; notes take no files',async()=>{assert.equal((await post({jobId:JOB,kind:'voice',logDate:'2026-10-12'})).status,400);assert.equal((await post({jobId:JOB,kind:'note',logDate:'2026-10-12',content:[{type:'p',children:[{text:'Hi'}]}]},[jpeg()])).status,400);assert.equal(fixture.created.length,0);});
test('a log without a job is rejected',async()=>{const res=await post({jobId:'',kind:'photo',logDate:'2026-10-12'},[jpeg()]);assert.equal(res.status,400);assert.match((await res.json()).message,/Choose a job/);});
