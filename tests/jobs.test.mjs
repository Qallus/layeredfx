import test from 'node:test';
import assert from 'node:assert/strict';
import {applyCommand,emptyState,OperationError} from '../lib/operations/engine.mjs';
import {jobBlocking,jobSteps,jobNeedsNext} from '../lib/operations/jobs.mjs';
import {DEFAULT_JOB_STAGES,JOB_PATH,JOB_STAGES} from '../lib/operations/defaults.mjs';

const NOW='2026-10-12T19:00:00.000Z';
const ADMIN={id:'admin',name:'Admin',role:'admin',email:'admin@example.test'};
const OWNER={id:'owner',name:'Owner',role:'staff',email:'owner@example.test'};
const VIEWER={id:'viewer',name:'Viewer',role:'viewer',email:'viewer@example.test'};
const fixture=()=>Object.assign(emptyState(),{people:[ADMIN,OWNER,VIEWER]});
const run=(state,command,actor=OWNER)=>applyCommand(state,command,actor,NOW);
function rejected(fn,status,pattern){assert.throws(fn,e=>e instanceof OperationError&&e.status===status&&(!pattern||pattern.test(e.message)));}
function manualJob(extra={}){const r=run(fixture(),{type:'job.create',name:'Feature wall',client:'Sample Client',email:'client@example.test',...extra});return {state:r.state,id:r.resultId};}
function wonDeal(){let s=run(fixture(),{type:'deal.create',name:'Cabinet wrap',client:'Won Client',email:'won@example.test',value:6000,closeDate:'2026-10-30'}).state;const id=s.deals[0].id;s=run(s,{type:'deal.stage',id,stage:'closed_won',wonSummary:'Approved',overrideReason:'Test setup'},ADMIN).state;return {state:s,dealId:id};}

test('every job stage has a guide and the path ends in complete',()=>{
 for(const stage of JOB_STAGES)assert.ok(DEFAULT_JOB_STAGES[stage].items.length,stage);
 assert.equal(JOB_PATH.at(-1),'complete');
});
test('a manual job links a client contact and starts in Handoff with a number',()=>{
 const {state,id}=manualJob();const job=state.jobs.find(j=>j.id===id);
 assert.equal(job.stage,'handoff');assert.match(job.number,/^LFX-26-001$/);
 assert.equal(state.contacts.find(c=>c.id===job.contactId)?.type,'client');
});
test('repeated handoff from one won opportunity opens the same job',()=>{
 const {state,dealId}=wonDeal();
 const first=run(state,{type:'job.create',opportunityId:dealId});
 const second=run(first.state,{type:'job.create',opportunityId:dealId});
 assert.equal(second.resultId,first.resultId);assert.equal(second.state.jobs.length,1);
 assert.equal(second.state.projects.find(p=>p.opportunityId===dealId)?.status,'job');
});
test('only won opportunities become jobs',()=>{
 const s=run(fixture(),{type:'deal.create',name:'Open deal',client:'C',email:'c@example.test',value:100,closeDate:'2026-10-30'}).state;
 rejected(()=>run(s,{type:'job.create',opportunityId:s.deals[0].id}),400,/won/);
});
test('required steps block advancing, including skipped stages',()=>{
 const {state,id}=manualJob();
 rejected(()=>run(state,{type:'job.stage',id,stage:'site_measure'}),400,/Site address recorded/);
 let s=run(state,{type:'job.update',id,patch:{address:'1 Test St',services:['Wall Wraps']}}).state;
 s=run(s,{type:'job.check',id,stage:'handoff',itemId:'scope',done:true}).state;
 s=run(s,{type:'job.stage',id,stage:'site_measure'}).state;
 assert.equal(s.jobs[0].stage,'site_measure');
 rejected(()=>run(s,{type:'job.stage',id,stage:'install'}),400,/Final measurements taken.*Client approved samples/);
});
test('only an administrator with a reason can override blockers, and the reason is kept',()=>{
 const {state,id}=manualJob();
 rejected(()=>run(state,{type:'job.stage',id,stage:'install',overrideReason:'Rush'}),400);
 rejected(()=>run(state,{type:'job.stage',id,stage:'install'},ADMIN),400);
 const s=run(state,{type:'job.stage',id,stage:'install',overrideReason:'Client walked scope on site'},ADMIN).state;
 assert.equal(s.jobs[0].stage,'install');assert.equal(s.jobs[0].stageHistory.at(-1).overrideReason,'Client walked scope on site');
});
test('on hold and cancelled need reasons; reopening needs a reason',()=>{
 const {state,id}=manualJob();
 rejected(()=>run(state,{type:'job.stage',id,stage:'on_hold'}),400,/on hold/);
 let s=run(state,{type:'job.stage',id,stage:'on_hold',holdReason:'Client travelling'}).state;
 assert.equal(s.jobs[0].holdReason,'Client travelling');
 s=run(s,{type:'job.stage',id,stage:'cancelled',cancelReason:'Budget'}).state;
 rejected(()=>run(s,{type:'job.stage',id,stage:'handoff'}),400,/reopen/);
 s=run(s,{type:'job.stage',id,stage:'handoff',reason:'Client came back'}).state;
 assert.equal(s.jobs[0].cancelReason,'');assert.equal(s.jobs[0].stageHistory.length,4);
});
test('resuming from hold still checks the skipped working stages',()=>{
 const {state,id}=manualJob();
 const s=run(state,{type:'job.stage',id,stage:'on_hold',holdReason:'Waiting'}).state;
 rejected(()=>run(s,{type:'job.stage',id,stage:'scheduled'}),400,/Handoff/);
});
test('automatic steps follow job fields and a manual uncheck keeps them open',()=>{
 let {state,id}=manualJob({address:'9 Site Rd'});
 assert.ok(jobSteps(state,state.jobs[0]).find(i=>i.id==='address').done);
 state=run(state,{type:'job.check',id,stage:'handoff',itemId:'address',done:false}).state;
 assert.ok(jobBlocking(state,state.jobs[0]).some(i=>i.id==='address'));
});
test('viewers cannot change jobs and stage settings are admin-only',()=>{
 const {state,id}=manualJob();
 rejected(()=>run(state,{type:'job.update',id,patch:{name:'X'}},VIEWER),403);
 rejected(()=>run(state,{type:'jobstage.configure',stage:'prep',config:{label:'Prep',goal:'G',actions:[],items:[]}}),403);
 const s=run(state,{type:'jobstage.configure',stage:'prep',config:{label:'Surface prep',goal:'Get ready',actions:['Sand'],items:[{id:'protected',label:'Protected',required:true}]}},ADMIN).state;
 assert.equal(s.jobStageConfig.prep.label,'Surface prep');
});
test('archived jobs are read-only until restored; next step tracking works',()=>{
 const {state,id}=manualJob();
 let s=run(state,{type:'job.archive',id}).state;
 rejected(()=>run(s,{type:'job.update',id,patch:{name:'X'}}),400,/Restore/);
 s=run(s,{type:'job.archive',id,restore:true}).state;
 assert.ok(jobNeedsNext(s.jobs[0],'2026-10-12'));
 s=run(s,{type:'job.next',id,action:'Order film',dueDate:'2026-10-20'}).state;
 assert.equal(jobNeedsNext(s.jobs[0],'2026-10-12'),false);
});
