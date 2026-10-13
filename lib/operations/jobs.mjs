// Jobs: the installation workflow after a won opportunity, built on the same rules as the Pipeline.
// Every stage change goes through jobTransition (via applyCommand); required steps block skipping ahead
// unless an administrator records an override reason. One won opportunity yields at most one job.
import {OperationError,uid,validDate,today} from './engine.mjs';
import {ensureContact} from './contacts.mjs';
import {DEFAULT_JOB_STAGES,JOB_PATH,JOB_STAGES,JOB_OPEN,SERVICES} from './defaults.mjs';
const fail=(message,status=400)=>{throw new OperationError(message,status);};
const text=(v,max=1000)=>typeof v==='string'?v.trim().slice(0,max):'';
const need=(v,label,max=200)=>{const t=text(v,max);if(!t)fail(`${label} is required.`);return t;};
const money=v=>{const n=Number(v||0);if(!Number.isFinite(n)||n<0||n>1e9)fail('Enter a valid job value.');return Math.round(n*100)/100;};
const oneOf=(v,options,label)=>options.includes(v)?v:fail(`Invalid ${label}.`);
const worker=(s,id)=>{const p=s.people.find(p=>p.id===id);if(!p||p.role==='viewer')fail('Choose an active team member who can work jobs.');return id;};
export const jobLabel=(s,stage)=>(s.jobStageConfig?.[stage]||DEFAULT_JOB_STAGES[stage]).label;
export function jobGuide(s,job,stage=job.stage){const g=s.jobStageConfig?.[stage]||DEFAULT_JOB_STAGES[stage];return {...structuredClone(g),items:[...structuredClone(g.items),...(job.extraItems||[]).filter(i=>i.stage===stage)]};}
function automatic(s,j,key){return {owner:!!j.owner,contact:!!s.contacts.find(c=>c.id===j.contactId),address:!!j.address,services:!!j.services?.length,start:!!j.startDate,crew:!!j.crew?.length,target:!!j.targetDate,completed:!!j.completedAt,hold:!!j.holdReason,cancel:!!j.cancelReason,next:!!j.nextStep?.action&&!!j.nextStep?.dueDate}[key]||false;}
// Automatic steps are verified from job fields; a stored `false` is a manual uncheck that keeps the step incomplete.
export function jobSteps(s,j,stage=j.stage){return jobGuide(s,j,stage).items.map(i=>{const key=`${stage}:${i.id}`;if(!i.auto)return {...i,automatic:false,autoDone:false,overridden:false,done:Boolean(j.checklist?.[key])};const autoDone=automatic(s,j,i.auto);const overridden=j.checklist?.[key]===false;return {...i,automatic:true,autoDone,overridden,done:autoDone&&!overridden};});}
export const jobBlocking=(s,j,stage=j.stage)=>jobSteps(s,j,stage).filter(i=>i.required&&!i.done);
export function jobNeedsNext(j,date=today()){return JOB_OPEN.includes(j.stage)&&(!j.nextStep?.dueDate||j.nextStep.dueDate<date);}
export function jobDays(j,now=new Date()){return Math.max(0,Math.floor((+now-Date.parse(j.stageEnteredAt||j.createdAt))/86400000));}
const job=(s,id)=>{const j=(s.jobs||[]).find(x=>x.id===id);if(!j)fail('Job not found.',404);return j;};
const log=(s,j,actor,now,kind,body)=>{s.jobActivities||=[];s.jobActivities.push({id:uid('jact'),jobId:j.id,kind,body,actor:actor.name,actorId:actor.id,occurredAt:now});};
function patch(s,p){
 const out={};
 if('name'in p)out.name=need(p.name,'Job name');
 if('address'in p)out.address=text(p.address,300);
 if('notes'in p)out.notes=text(p.notes,10000);
 if('value'in p)out.value=money(p.value);
 if('startDate'in p)out.startDate=validDate(p.startDate);
 if('targetDate'in p)out.targetDate=validDate(p.targetDate);
 if('owner'in p)out.owner=worker(s,p.owner);
 if('crew'in p){if(!Array.isArray(p.crew)||p.crew.length>30)fail('Invalid crew.');out.crew=[...new Set(p.crew.map(id=>worker(s,id)))];}
 if('services'in p){if(!Array.isArray(p.services))fail('Invalid services.');out.services=[...new Set(p.services.filter(x=>SERVICES.includes(x)))];}
 if(out.startDate&&out.targetDate&&out.targetDate<out.startDate)fail('The target completion date must be on or after the start date.');
 return out;
}
function jobTransition(s,j,to,c,actor,now){
 oneOf(to,JOB_STAGES,'job stage');
 if(j.stage===to)return;
 if(j.archivedAt)fail('Restore this job before editing.');
 const from=j.stage,closed=['complete','cancelled'].includes(from);
 if(closed&&!text(c.reason))fail('A reopen reason is required.');
 if(to==='on_hold'&&!text(c.holdReason))fail('Record why the job is on hold.');
 if(to==='cancelled'&&!text(c.cancelReason))fail('Record why the job was cancelled.');
 // On hold resumes from the last working stage, so skipped requirements are still checked.
 const working=from==='on_hold'?[...j.stageHistory].reverse().find(e=>JOB_OPEN.includes(e.stage))?.stage||'handoff':from;
 const forward=!closed&&JOB_PATH.includes(to)&&JOB_PATH.includes(working)&&JOB_PATH.indexOf(to)>JOB_PATH.indexOf(working);
 const stages=forward?JOB_PATH.slice(JOB_PATH.indexOf(working),JOB_PATH.indexOf(to)):[];
 const blockers=stages.flatMap(stage=>jobBlocking(s,j,stage).map(i=>`${jobLabel(s,stage)}: ${i.label}`));
 if(blockers.length&&!(actor.role==='admin'&&text(c.overrideReason)))fail(`Complete required steps before advancing: ${blockers.join('; ')}`);
 j.stage=to;j.stageEnteredAt=now;
 const event={stage:to,from,at:now,by:actor.id,note:text(c.reason||c.holdReason||c.cancelReason,2000),overrideReason:text(c.overrideReason,2000)};
 j.stageHistory.push(event);
 if(closed){j.reopenedAt=now;j.completedAt=null;if(from==='cancelled')j.cancelReason='';}
 if(from==='on_hold')j.holdReason='';
 if(to==='on_hold')j.holdReason=need(c.holdReason,'Hold reason',2000);
 if(to==='cancelled')j.cancelReason=need(c.cancelReason,'Cancellation reason',2000);
 if(to==='complete')j.completedAt=now;
 log(s,j,actor,now,'stage',`${jobLabel(s,from)} → ${jobLabel(s,to)}${event.overrideReason?` · Admin override: ${event.overrideReason}`:''}${event.note?` · ${event.note}`:''}`);
}
export function jobCommand(s,c,actor,now){
 s.jobs||=[];
 if(c.type.startsWith('job.')&&c.type!=='job.create'&&c.type!=='job.archive'&&job(s,c.id).archivedAt)fail('Restore the job before making changes.');
 switch(c.type){
  case 'job.create':{
   let deal=null;
   if(c.opportunityId){
    deal=s.deals.find(d=>d.id===c.opportunityId)||fail('Opportunity not found.',404);
    // Repeated handoff opens the same job instead of creating a duplicate.
    const existing=s.jobs.find(j=>j.opportunityId===deal.id);if(existing)return existing.id;
    if(deal.archivedAt||deal.stage!=='closed_won')fail('Mark the opportunity won before creating its job.');
   }
   const contactId=deal?deal.contactId:c.contactId?(s.contacts.find(x=>x.id===c.contactId)||fail('Contact not found.',404)).id:ensureContact(s,{name:need(c.client,'Client name'),email:text(c.email,254),phone:text(c.phone,60),company:'',source:'Job',owner:c.owner||actor.id,type:'client'},actor,now).id;
   const project=deal?s.projects.find(p=>p.opportunityId===deal.id):null;
   const fields=patch(s,{name:c.name||deal?.name,owner:c.owner||deal?.owner||actor.id,value:c.value??deal?.value??0,services:c.services||deal?.products||[],address:c.address||'',startDate:c.startDate||'',targetDate:c.targetDate||'',notes:c.notes||'',crew:c.crew||[]});
   const year=String(new Date(now).getUTCFullYear()).slice(-2),number=`LFX-${year}-${String(s.jobs.filter(j=>j.number?.startsWith(`LFX-${year}-`)).length+1).padStart(3,'0')}`;
   const j={id:uid('job'),number,name:fields.name,contactId,opportunityId:deal?.id||null,projectId:project?.id||null,owner:fields.owner,crew:fields.crew,address:fields.address,services:fields.services,value:fields.value,startDate:fields.startDate,targetDate:fields.targetDate,notes:fields.notes,stage:'handoff',stageEnteredAt:now,stageHistory:[{stage:'handoff',at:now,by:actor.id,note:deal?'Created from won opportunity.':'Created manually.'}],checklist:{},extraItems:[],nextStep:null,holdReason:'',cancelReason:'',createdAt:now,updatedAt:now,completedAt:null,archivedAt:null};
   s.jobs.push(j);if(project)project.status='job';
   log(s,j,actor,now,'created',deal?`Job created from opportunity ${deal.name}.`:'Job created.');
   return j.id;
  }
  case 'job.update':{const j=job(s,c.id);Object.assign(j,patch(s,c.patch||{}),{updatedAt:now});log(s,j,actor,now,'update','Job details updated.');return j.id;}
  case 'job.stage':{const j=job(s,c.id);jobTransition(s,j,c.stage,c,actor,now);j.updatedAt=now;return j.id;}
  case 'job.check':{
   const j=job(s,c.id);const stage=oneOf(c.stage,JOB_STAGES,'job stage');const item=jobGuide(s,j,stage).items.find(i=>i.id===c.itemId)||fail('Checklist item not found.');const key=`${stage}:${item.id}`;j.checklist||={};
   // Unchecking an automatic step records a manual override; checking it again restores field verification. Never forces completion.
   if(item.auto){if(c.done)delete j.checklist[key];else j.checklist[key]=false;}else j.checklist[key]=!!c.done;
   log(s,j,actor,now,'checklist',`${item.label}: ${c.done?'complete':'reopened'}`);return j.id;
  }
  case 'job.extra':{const j=job(s,c.id);const stage=oneOf(c.stage,JOB_STAGES,'job stage');if(c.removeId)j.extraItems=j.extraItems.filter(i=>i.id!==c.removeId);else{if(j.extraItems.length>=60)fail('This job has too many custom steps.');j.extraItems.push({id:uid('extra'),label:need(c.label,'Step'),required:!!c.required,stage});}log(s,j,actor,now,'checklist','Job-specific checklist updated.');return j.id;}
  case 'job.next':{const j=job(s,c.id);j.nextStep=c.clear?null:{action:need(c.action,'Next action'),dueDate:validDate(c.dueDate,true),assignee:worker(s,c.assignee||j.owner)};log(s,j,actor,now,'next_step',c.clear?'Next step cleared.':`Next: ${j.nextStep.action} · ${j.nextStep.dueDate}`);return j.id;}
  case 'job.archive':{const j=job(s,c.id);j.archivedAt=c.restore?null:now;log(s,j,actor,now,'archive',c.restore?'Job restored.':'Job archived; history retained.');return j.id;}
  case 'jobstage.configure':{
   if(actor.role!=='admin')fail('Job stage settings require an administrator.',403);
   const stage=oneOf(c.stage,JOB_STAGES,'job stage');s.jobStageConfig||={};
   if(c.reset){delete s.jobStageConfig[stage];return null;}
   const p=c.config;if(!p||!Array.isArray(p.items)||p.items.length>40||!Array.isArray(p.actions)||p.actions.length>20)fail('Invalid stage settings.');
   const defaults=DEFAULT_JOB_STAGES[stage].items,ids=new Set();
   s.jobStageConfig[stage]={label:need(p.label,'Stage label',60),goal:need(p.goal,'Stage goal',2000),actions:p.actions.map(a=>text(a,500)).filter(Boolean),items:p.items.map(i=>{const id=need(i.id,'Item ID',80);if(ids.has(id))fail('Checklist item IDs must be unique.');ids.add(id);return {id,label:need(i.label,'Checklist label'),required:!!i.required,auto:defaults.find(d=>d.id===id)?.auto||null};})};
   return null;
  }
  default:fail('Unsupported operation.');
 }
}
