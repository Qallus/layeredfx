// AI agent hub: Eve (Hermes Agent), Paperclip agent teams and the xAI voice agent.
// This stores setup, skills, training documents and assignments only. Nothing here runs a model, calls an
// agent or sends a message; connection status comes from server env checks in lib/agents/connections.ts.
import {OperationError,uid,validDate} from './engine.mjs';
const fail=(message,status=400)=>{throw new OperationError(message,status);};
const text=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
const oneOf=(v,list,label)=>list.includes(v)?v:fail(`Invalid ${label}.`);
const object=(v,label)=>v&&typeof v==='object'&&!Array.isArray(v)?v:fail(`Invalid ${label}.`);
function httpsUrl(v,label){
 const t=text(v,1000);if(!t)return '';
 let url;try{url=new URL(t);}catch{fail(`${label} must be an https URL.`);}
 if(url.protocol!=='https:'||url.username||url.password)fail(`${label} must be an https URL.`);
 return t.replace(/\/$/,'');
}

export const AGENT_IDS=['eve','paperclip','voice'];
export const AGENT_CHANNELS=['dashboard','sms','email','phone','web_chat'];
/** off: not used. draft: prepares drafts for a person to send. approval: may act only after a team member approves. */
export const SKILL_MODES=['off','draft','approval'];
export const ASSIGNMENT_STATUSES=['queued','in_progress','needs_review','done','canceled'];
export const ASSIGNMENT_PRIORITIES=['low','medium','high'];
export const DOC_STATUSES=['draft','active','archived'];
export const AGENT_SKILLS=[
 {id:'briefing',label:'Daily briefing',description:'Summarize what is due, overdue and waiting today.',agents:['eve']},
 {id:'lead_intake',label:'Lead intake',description:'Summarize new website, card and studio leads and suggest the next step.',agents:['eve','paperclip']},
 {id:'follow_up',label:'Follow-up drafts',description:'Draft SMS and email follow-ups for open opportunities.',agents:['eve','paperclip']},
 {id:'quotes',label:'Quote and SOW drafts',description:'Prepare quote and scope-of-work drafts from opportunity notes.',agents:['eve','paperclip']},
 {id:'scheduling',label:'Scheduling help',description:'Suggest consultation and install times from open bookings.',agents:['eve','voice']},
 {id:'reviews',label:'Google review replies',description:'Draft replies to Google Business Profile reviews.',agents:['eve']},
 {id:'content',label:'Content drafts',description:'Draft blog posts, social captions and service page updates.',agents:['paperclip']},
 {id:'research',label:'Research',description:'Research materials, suppliers and local competitors.',agents:['paperclip']},
 {id:'answer_calls',label:'Answer calls',description:'Greet callers, answer common questions and capture their details.',agents:['voice']},
 {id:'call_summaries',label:'Call summaries',description:'Summarize calls for the contact timeline.',agents:['voice']},
];
export const AGENT_DEFAULTS={
 eve:{id:'eve',name:'Eve',role:'Main assistant',platform:'Hermes Agent',endpoint:'https://agent.layeredfx.com',enabled:false,instructions:'',channels:{dashboard:true},skills:{}},
 paperclip:{id:'paperclip',name:'Paperclip teams',role:'Agent teams for projects, content and research',platform:'Paperclip',endpoint:'https://team.layeredfx.com',enabled:false,instructions:'',channels:{dashboard:true},skills:{}},
 voice:{id:'voice',name:'Voice agent',role:'Answers and summarizes calls',platform:'xAI Voice',endpoint:'',enabled:false,instructions:'',greeting:'',voiceName:'',channels:{phone:true},skills:{}},
};
/** Stored overrides merged over the defaults, for display. */
export function agentsFor(state){return AGENT_IDS.map(id=>({...AGENT_DEFAULTS[id],...(state.agents?.[id]||{}),channels:{...AGENT_DEFAULTS[id].channels,...(state.agents?.[id]?.channels||{})},skills:{...(state.agents?.[id]?.skills||{})}}));}

function agentPatch(s,id,p){
 const out={};
 if('name' in p){out.name=text(p.name,80);if(!out.name)fail('Agent name is required.');}
 if('role' in p)out.role=text(p.role,120);
 if('instructions' in p)out.instructions=text(p.instructions,8000);
 if('greeting' in p)out.greeting=text(p.greeting,500);
 if('voiceName' in p)out.voiceName=text(p.voiceName,60);
 if('enabled' in p)out.enabled=p.enabled===true;
 if('endpoint' in p)out.endpoint=httpsUrl(p.endpoint,'Agent address');
 if('escalateTo' in p){out.escalateTo=text(p.escalateTo,120);if(out.escalateTo&&!s.people.some(x=>x.id===out.escalateTo))fail('Choose an active team member for escalations.');}
 if('channels' in p){const channels=object(p.channels,'channels');for(const key of Object.keys(channels))oneOf(key,AGENT_CHANNELS,'channel');out.channels=Object.fromEntries(Object.entries(channels).map(([k,v])=>[k,v===true]));}
 if('skills' in p){
  const skills=object(p.skills,'skills');const allowed=new Set(AGENT_SKILLS.filter(k=>k.agents.includes(id)).map(k=>k.id));
  for(const [key,mode] of Object.entries(skills)){if(!allowed.has(key))fail('That skill is not available for this agent.');oneOf(mode,SKILL_MODES,'skill mode');}
  out.skills=skills;
 }
 return out;
}

export function agentCommand(s,c,actor,now){
 const admin=actor.role==='admin';
 const requireAdmin=()=>{if(!admin)fail('Only administrators can change agent setup.',403);};
 switch(c.type){
  case 'agent.save':{
   requireAdmin();const id=oneOf(c.id,AGENT_IDS,'agent');const patch=agentPatch(s,id,object(c.patch||{},'agent settings'));
   s.agents||={};const current=s.agents[id]||{};
   s.agents[id]={...current,...patch,channels:{...(current.channels||{}),...(patch.channels||{})},skills:{...(current.skills||{}),...(patch.skills||{})},updatedAt:now,updatedBy:actor.id};
   return id;
  }
  case 'agent.doc.save':{
   requireAdmin();const docs=s.agentDocs||=[];const p=object(c.patch||{},'document');
   const doc=c.id?docs.find(d=>d.id===c.id)||fail('Training document not found.',404):null;
   const title=text(p.title??doc?.title,150);if(!title)fail('Document title is required.');
   const kind=oneOf(p.kind??doc?.kind??'note',['note','link'],'document type');
   const url=kind==='link'?httpsUrl(p.url??doc?.url,'Document link'):'';if(kind==='link'&&!url)fail('Add an https link for this document.');
   const body=kind==='note'?text(p.body??doc?.body,20000):'';if(kind==='note'&&!body)fail('Add the training notes.');
   const agentList=p.agents??doc?.agents;if(!Array.isArray(agentList))fail('Choose at least one agent.');
   const agents=[...new Set(agentList.map(a=>oneOf(a,AGENT_IDS,'agent')))];if(!agents.length)fail('Choose at least one agent.');
   const next={title,kind,url,body,agents,category:text(p.category??doc?.category,60),status:oneOf(p.status??doc?.status??'active',DOC_STATUSES,'document status'),updatedAt:now,updatedBy:actor.id};
   if(doc){Object.assign(doc,next);return doc.id;}
   if(docs.length>=200)fail('The training library is full. Archive or remove documents first.');
   const created={id:uid('agentdoc'),createdAt:now,...next};docs.push(created);return created.id;
  }
  case 'agent.doc.delete':{
   requireAdmin();const docs=s.agentDocs||[];if(!docs.some(d=>d.id===c.id))fail('Training document not found.',404);
   s.agentDocs=docs.filter(d=>d.id!==c.id);return c.id;
  }
  case 'agent.assign':{
   const list=s.agentAssignments||=[];const p=object(c.patch||{},'assignment');
   const title=text(p.title,200);if(!title)fail('Assignment title is required.');
   const dealId=text(p.dealId,120);if(dealId&&!s.deals.some(d=>d.id===dealId))fail('Opportunity not found.',404);
   const contactId=text(p.contactId,120);if(contactId&&!s.contacts.some(x=>x.id===contactId))fail('Contact not found.',404);
   if(list.filter(a=>!['done','canceled'].includes(a.status)).length>=500)fail('Too many open assignments. Close some before adding more.');
   const item={id:uid('assign'),title,agent:oneOf(p.agent,AGENT_IDS,'agent'),details:text(p.details,4000),priority:oneOf(p.priority??'medium',ASSIGNMENT_PRIORITIES,'priority'),dueDate:validDate(p.dueDate),dealId,contactId,status:'queued',createdBy:actor.id,createdByName:actor.name,createdAt:now,updatedAt:now,log:[{at:now,actorId:actor.id,actorName:actor.name,text:'Assigned'}]};
   list.push(item);return item.id;
  }
  case 'agent.assignment.update':{
   const item=(s.agentAssignments||[]).find(a=>a.id===c.id)||fail('Assignment not found.',404);
   if(!admin&&item.createdBy!==actor.id)fail('Only the person who assigned this or an administrator can change it.',403);
   const status=c.status===undefined?item.status:oneOf(c.status,ASSIGNMENT_STATUSES,'assignment status');const note=text(c.note,1000);
   if(status===item.status&&!note)fail('Nothing to update.');
   const entry=[status!==item.status?`Status: ${status.replace('_',' ')}`:'',note].filter(Boolean).join(' · ');
   Object.assign(item,{status,updatedAt:now,log:[...(item.log||[]),{at:now,actorId:actor.id,actorName:actor.name,text:entry}].slice(-50)});
   return item.id;
  }
  case 'agent.assignment.delete':{
   const item=(s.agentAssignments||[]).find(a=>a.id===c.id)||fail('Assignment not found.',404);
   if(!admin&&item.createdBy!==actor.id)fail('Only the person who assigned this or an administrator can remove it.',403);
   s.agentAssignments=s.agentAssignments.filter(a=>a.id!==item.id);return item.id;
  }
  default:fail('Unsupported agent operation.');
 }
}
