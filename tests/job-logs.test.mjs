import test from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import {readFileSync} from 'node:fs';
const url=source=>`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile=file=>ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const engine=new URL('../lib/operations/engine.mjs',import.meta.url).href;
const {parseDraft,checkFiles,contentMatches,baseMime,extensionFor,parsePatch,canChange}=await import(url(compile('../lib/jobs/logs-model.ts').replace('@/lib/operations/engine.mjs',engine)));
const {OperationError}=await import(engine);
const JOB='job_12345678-1234-1234-1234-123456789abc';
const rejected=(fn,pattern,status=400)=>assert.throws(fn,e=>e instanceof OperationError&&e.status===status&&pattern.test(e.message));
const note=text=>[{type:'p',children:[{text}]}];

test('a note keeps rich content and stores searchable plain text',()=>{
 const d=parseDraft({jobId:JOB,kind:'note',logDate:'2026-10-12',title:'Prep',content:[{type:'h2',children:[{text:'Prep'}]},...note('Walls sanded')]});
 assert.equal(d.kind,'note');assert.match(d.body,/Prep[\s\S]*Walls sanded/);assert.equal(d.content.length,2);assert.equal(d.transcriptSource,null);
});
test('a log needs a job, a known type, a valid date and (for notes) text',()=>{
 rejected(()=>parseDraft({jobId:'',kind:'note',logDate:'2026-10-12',content:note('x')}),/Choose a job/);
 rejected(()=>parseDraft({jobId:JOB,kind:'video',logDate:'2026-10-12'}),/Notes, Voice note or Photos/);
 rejected(()=>parseDraft({jobId:JOB,kind:'note',logDate:'2026-10-12',content:note('  ')}),/Write a note/);
 assert.throws(()=>parseDraft({jobId:JOB,kind:'voice',logDate:'not-a-date'}));
 rejected(()=>parseDraft({jobId:JOB,kind:'note',logDate:'2026-10-12',content:[{type:'a',url:'javascript:alert(1)',children:[{text:'x'}]}]}),/HTTP/);
});
test('the device-transcript label is only kept for voice notes with text',()=>{
 assert.equal(parseDraft({jobId:JOB,kind:'voice',logDate:'2026-10-12',body:'Crew finished prep',transcriptSource:'device'}).transcriptSource,'device');
 assert.equal(parseDraft({jobId:JOB,kind:'voice',logDate:'2026-10-12',body:'',transcriptSource:'device'}).transcriptSource,null);
 assert.equal(parseDraft({jobId:JOB,kind:'photo',logDate:'2026-10-12',body:'x',transcriptSource:'device'}).transcriptSource,null);
});
test('file rules per log type',()=>{
 const jpg={type:'image/jpeg',size:1000},webm={type:'audio/webm;codecs=opus',size:1000};
 checkFiles('note',[]);checkFiles('voice',[webm]);checkFiles('photo',[jpg,jpg]);
 rejected(()=>checkFiles('note',[jpg]),/attachments/);
 rejected(()=>checkFiles('voice',[]),/one audio file/);
 rejected(()=>checkFiles('voice',[jpg]),/WebM, M4A/);
 rejected(()=>checkFiles('photo',[]),/between 1 and 20/);
 rejected(()=>checkFiles('photo',Array(21).fill(jpg)),/between 1 and 20/);
 rejected(()=>checkFiles('photo',[{type:'image/gif',size:10}]),/JPEG, PNG or WebP/);
 rejected(()=>checkFiles('photo',[{type:'image/jpeg',size:16*1024*1024}]),/15 MB/,413);
});
test('codec parameters are stripped and file signatures are checked',()=>{
 assert.equal(baseMime('audio/webm;codecs=opus'),'audio/webm');assert.equal(baseMime('audio/x-m4a'),'audio/mp4');assert.equal(extensionFor('audio/mp4'),'m4a');
 assert.ok(contentMatches('image/jpeg',new Uint8Array([0xff,0xd8,0xff])));
 assert.ok(contentMatches('audio/webm;codecs=opus',new Uint8Array([0x1a,0x45,0xdf,0xa3])));
 assert.ok(contentMatches('audio/mp4',new Uint8Array([0,0,0,0x20,...Buffer.from('ftyp')])));
 assert.equal(contentMatches('image/png',new Uint8Array([0xff,0xd8])),false);
 assert.equal(contentMatches('text/html',Buffer.from('<html>')),false);
});
test('edits keep note content valid and only the author or an admin may change a log',()=>{
 assert.match(parsePatch('note',{content:note('Updated')}).body,/Updated/);
 rejected(()=>parsePatch('note',{content:note('')}),/cannot be empty/);
 assert.equal(parsePatch('voice',{body:' corrected '}).body,'corrected');
 assert.ok(canChange({createdBy:'a'},{id:'a',role:'staff'}));
 assert.ok(canChange({createdBy:'a'},{id:'b',role:'admin'}));
 assert.equal(canChange({createdBy:'a'},{id:'b',role:'staff'}),false);
 assert.equal(canChange({createdBy:'a'},{id:'a',role:'viewer'}),false);
});
