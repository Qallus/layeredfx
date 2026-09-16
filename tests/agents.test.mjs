import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {applyCommand,emptyState,OperationError} from '../lib/operations/engine.mjs';
import {agentsFor,AGENT_SKILLS} from '../lib/operations/agents.mjs';

const NOW='2026-09-15T17:00:00.000Z';
const ADMIN={id:'admin',name:'Admin',role:'admin',email:'admin@example.test'};
const STAFF={id:'staff',name:'Staff',role:'staff',email:'staff@example.test'};
const OTHER={id:'other',name:'Other',role:'staff',email:'other@example.test'};
const VIEWER={id:'viewer',name:'Viewer',role:'viewer',email:'viewer@example.test'};
const fixture=()=>Object.assign(emptyState(),{people:[ADMIN,STAFF,OTHER,VIEWER]});
const run=(state,command,actor=ADMIN)=>applyCommand(state,command,actor,NOW);
const rejected=(fn,status,pattern)=>assert.throws(fn,e=>e instanceof OperationError&&e.status===status&&(!pattern||pattern.test(e.message)));

test('only administrators change agent setup, and settings merge over defaults',()=>{
  rejected(()=>run(fixture(),{type:'agent.save',id:'eve',patch:{enabled:true}},STAFF),403);
  rejected(()=>run(fixture(),{type:'agent.save',id:'eve',patch:{enabled:true}},VIEWER),403);
  rejected(()=>run(fixture(),{type:'agent.save',id:'hal',patch:{}}),400,/agent/);
  let {state}=run(fixture(),{type:'agent.save',id:'eve',patch:{enabled:true,instructions:'  Be concise.  ',channels:{sms:true},skills:{reviews:'draft'},escalateTo:'staff'}});
  state=run(state,{type:'agent.save',id:'eve',patch:{skills:{briefing:'approval'},channels:{email:true}}}).state;
  const eve=agentsFor(state).find(a=>a.id==='eve');
  assert.equal(eve.enabled,true);assert.equal(eve.instructions,'Be concise.');
  assert.deepEqual(eve.channels,{dashboard:true,sms:true,email:true});
  assert.deepEqual(eve.skills,{reviews:'draft',briefing:'approval'});
  assert.equal(eve.endpoint,'https://agent.layeredfx.com');
});

test('agent settings reject unsafe values',()=>{
  rejected(()=>run(fixture(),{type:'agent.save',id:'eve',patch:{endpoint:'http://agent.layeredfx.com'}}),400,/https/);
  rejected(()=>run(fixture(),{type:'agent.save',id:'eve',patch:{endpoint:'https://user:pass@agent.layeredfx.com'}}),400,/https/);
  rejected(()=>run(fixture(),{type:'agent.save',id:'eve',patch:{channels:{fax:true}}}),400,/channel/);
  rejected(()=>run(fixture(),{type:'agent.save',id:'voice',patch:{skills:{reviews:'draft'}}}),400,/not available/);
  rejected(()=>run(fixture(),{type:'agent.save',id:'eve',patch:{skills:{reviews:'autonomous'}}}),400,/skill mode/);
  rejected(()=>run(fixture(),{type:'agent.save',id:'eve',patch:{escalateTo:'stranger'}}),400);
  rejected(()=>run(fixture(),{type:'agent.save',id:'eve',patch:{name:'  '}}),400,/name/);
  assert.ok(AGENT_SKILLS.every(s=>s.agents.length>0));
});

test('training documents need a title, content and at least one agent',()=>{
  rejected(()=>run(fixture(),{type:'agent.doc.save',patch:{title:'Pricing',kind:'note',body:'x',agents:['eve']}},STAFF),403);
  rejected(()=>run(fixture(),{type:'agent.doc.save',patch:{title:'Pricing',kind:'note',body:'',agents:['eve']}}),400,/notes/);
  rejected(()=>run(fixture(),{type:'agent.doc.save',patch:{title:'Pricing',kind:'link',url:'javascript:alert(1)',agents:['eve']}}),400,/https/);
  rejected(()=>run(fixture(),{type:'agent.doc.save',patch:{title:'Pricing',kind:'note',body:'x',agents:[]}}),400,/agent/);
  let r=run(fixture(),{type:'agent.doc.save',patch:{title:'Service area',kind:'note',body:'Greater Phoenix.',agents:['eve','voice','eve']}});
  assert.deepEqual(r.state.agentDocs[0].agents,['eve','voice']);
  r=run(r.state,{type:'agent.doc.save',id:r.resultId,patch:{status:'archived'}});
  assert.equal(r.state.agentDocs[0].status,'archived');assert.equal(r.state.agentDocs[0].body,'Greater Phoenix.');
  r=run(r.state,{type:'agent.doc.delete',id:r.resultId});
  assert.equal(r.state.agentDocs.length,0);
});

test('staff assign work to agents; only the assigner or an admin changes it',()=>{
  rejected(()=>run(fixture(),{type:'agent.assign',patch:{title:'Draft reply',agent:'eve'}},VIEWER),403);
  rejected(()=>run(fixture(),{type:'agent.assign',patch:{title:'Draft reply',agent:'eve',dealId:'missing'}},STAFF),404);
  rejected(()=>run(fixture(),{type:'agent.assign',patch:{title:'Draft reply',agent:'eve',dueDate:'2026-02-30'}},STAFF),400);
  let r=run(fixture(),{type:'agent.assign',patch:{title:'Draft review replies',agent:'eve',priority:'high',dueDate:'2026-09-16'}},STAFF);
  const id=r.resultId;
  assert.equal(r.state.agentAssignments[0].status,'queued');assert.equal(r.state.agentAssignments[0].createdBy,'staff');
  rejected(()=>run(r.state,{type:'agent.assignment.update',id,status:'done'},OTHER),403);
  rejected(()=>run(r.state,{type:'agent.assignment.update',id,status:'finished'},STAFF),400);
  rejected(()=>run(r.state,{type:'agent.assignment.update',id},STAFF),400,/Nothing/);
  r=run(r.state,{type:'agent.assignment.update',id,status:'needs_review',note:'Drafts ready'},STAFF);
  assert.equal(r.state.agentAssignments[0].log.at(-1).text,'Status: needs review · Drafts ready');
  rejected(()=>run(r.state,{type:'agent.assignment.delete',id},OTHER),403);
  r=run(r.state,{type:'agent.assignment.delete',id},ADMIN);
  assert.equal(r.state.agentAssignments.length,0);
});

const connectionsSource=ts.transpileModule(readFileSync(new URL('../lib/agents/connections.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {agentConnections}=await import(`data:text/javascript;base64,${Buffer.from(connectionsSource).toString('base64')}`);

test('agent connection status reports variable names, never secret values',()=>{
  const env={LFX_HERMES_URL:'https://agent.layeredfx.com/v1',LFX_HERMES_API_KEY:'sk-secret-hermes',LFX_PAPERCLIP_URL:'http://team.layeredfx.com',LFX_PAPERCLIP_API_KEY:'pc-secret',LFX_XAI_API_KEY:'xai-secret'};
  const result=agentConnections(env);const json=JSON.stringify(result);
  for(const secret of ['sk-secret-hermes','pc-secret','xai-secret'])assert.equal(json.includes(secret),false);
  const byId=Object.fromEntries(result.map(r=>[r.id,r]));
  assert.equal(byId.eve.configured,true);assert.equal(byId.eve.address,'https://agent.layeredfx.com');
  assert.equal(byId.paperclip.configured,false);assert.deepEqual(byId.paperclip.missing,['LFX_PAPERCLIP_URL','LFX_PAPERCLIP_COMPANY_ID']);
  assert.equal(byId.voice.configured,true);
  assert.equal(agentConnections({}).some(r=>r.configured),false);
});

test('agent status route requires staff and returns no secrets',()=>{
  const source=readFileSync(new URL('../app/api/operations/agents/route.ts',import.meta.url),'utf8');
  assert.match(source,/currentActor\(\)/);assert.match(source,/viewer/);
  assert.doesNotMatch(source,/process\.env/);
  for(const file of ['../components/operations/agents.tsx']){
    let text='';try{text=readFileSync(new URL(file,import.meta.url),'utf8');}catch{continue;}
    assert.doesNotMatch(text,/process\.env|NEXT_PUBLIC_.*(KEY|SECRET)/);
  }
});

test('Coolify env blocks, .env.example and the setup doc cover every agent variable',()=>{
  const connections=readFileSync(new URL('../lib/agents/connections.ts',import.meta.url),'utf8');
  const names=[...new Set(connections.match(/LFX_[A-Z_]+/g))];
  const page=readFileSync(new URL('../components/operations/agents.tsx',import.meta.url),'utf8');
  const example=readFileSync(new URL('../.env.example',import.meta.url),'utf8');
  const doc=readFileSync(new URL('../docs/AI_AGENTS.md',import.meta.url),'utf8');
  for(const name of names){
    assert.match(page,new RegExp(`'${name}=`),`${name} missing from the Coolify block`);
    assert.match(example,new RegExp(`^${name}=`,'m'),`${name} missing from .env.example`);
    assert.match(doc,new RegExp(`^${name}=`,'m'),`${name} missing from docs/AI_AGENTS.md`);
  }
  assert.doesNotMatch(example,/NEXT_PUBLIC_[A-Z_]*(XAI|HERMES|PAPERCLIP)/);
});

test('a send result records delivery, moves the assignment on, and keeps failures re-sendable', () => {
  let r = run(fixture(), {type: 'agent.assign', patch: {title: 'Draft replies', agent: 'paperclip'}}, STAFF);
  const id = r.resultId;
  // A failed send leaves the assignment queued.
  r = run(r.state, {type: 'agent.assignment.result', id, outcome: 'failed', service: 'paperclip', detail: 'Paperclip did not confirm the request.', requestId: 'lfx-1-1'}, STAFF);
  let item = r.state.agentAssignments[0];
  assert.equal(item.status, 'queued');
  assert.equal(item.delivery.state, 'failed');
  assert.equal(item.delivery.attempts, 1);
  assert.match(item.delivery.lastError, /did not confirm/);
  assert.match(item.log.at(-1).text, /^Send failed/);
  // A successful send records the external task and starts the work.
  r = run(r.state, {type: 'agent.assignment.result', id, outcome: 'sent', service: 'paperclip', externalId: 'PC-9', externalUrl: 'https://team.layeredfx.com/issues/PC-9', requestId: 'lfx-1-2'}, STAFF);
  item = r.state.agentAssignments[0];
  assert.equal(item.status, 'in_progress');
  assert.equal(item.delivery.state, 'sent');
  assert.equal(item.delivery.attempts, 2);
  assert.equal(item.delivery.lastError, '');
  assert.match(item.log.at(-1).text, /Sent to paperclip . PC-9/);
});

test('send results reject unsafe values and other members', () => {
  const started = run(fixture(), {type: 'agent.assign', patch: {title: 'Draft replies', agent: 'eve'}}, STAFF);
  const id = started.resultId;
  rejected(() => run(started.state, {type: 'agent.assignment.result', id, outcome: 'maybe', service: 'hermes'}, STAFF), 400, /send outcome/);
  rejected(() => run(started.state, {type: 'agent.assignment.result', id, outcome: 'sent', service: 'slack'}, STAFF), 400, /agent service/);
  rejected(() => run(started.state, {type: 'agent.assignment.result', id, outcome: 'sent', service: 'hermes', externalUrl: 'http://team.layeredfx.com/x'}, STAFF), 400, /https/);
  rejected(() => run(started.state, {type: 'agent.assignment.result', id, outcome: 'sent', service: 'hermes'}, OTHER), 403);
  rejected(() => run(started.state, {type: 'agent.assignment.result', id: 'assign_missing', outcome: 'sent', service: 'hermes'}, STAFF), 404);
});

test('clients cannot record a send result through the operations route', () => {
  const source = readFileSync(new URL('../app/api/operations/route.ts', import.meta.url), 'utf8');
  assert.match(source, /agent\.assignment\.result/);
  assert.match(source, /recorded by the agent service/);
});
