"use client";
// AI Agents: Eve (Hermes Agent), Paperclip agent teams and the xAI voice agent.
// Setup, skills, training documents and assignments are saved through applyCommand. Nothing on this page runs an
// agent, calls a model or sends a message; the Setup tab only reports which server variables are set.
import {useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,BookOpen,Bot,Check,CircleDashed,ClipboardList,Copy,KeyRound,MessageSquare,Mic,Pencil,Plus,Sparkles,Trash2,Users} from 'lucide-react';
import {AGENT_CHANNELS,AGENT_SKILLS,ASSIGNMENT_STATUSES,agentsFor,type AgentView} from '@/lib/operations/agents.mjs';
import type {AgentAssignment,AgentChannel,AgentDoc,AgentId,AssignmentStatus,Command,SkillMode} from '@/lib/operations/types';
import {AGENT_ENV,type AgentConnection} from '@/lib/agents/connections';
import {business,businessAddressLine,businessHoursLine} from '@/lib/business/profile';
import {BrandedInput,BrandedSelect} from './branded-fields';
import {useOperations} from './provider';
import {Button,Empty,Field,Modal,PageTitle,Panel,Views,dateLabel} from './shared';
import './agents.css';

type Dispatch=(c:Command)=>Promise<string|null>;
const TABS=['Overview','Communication','Skills','Training docs','Assignments','Setup'];
const AGENT_ICON={eve:Bot,paperclip:Users,voice:Mic};
const CHANNEL_INFO:Record<AgentChannel,{label:string;detail:string}>={
 dashboard:{label:'Dashboard',detail:'Assignments and chat inside LayeredFX.'},
 sms:{label:'SMS',detail:'Through the LayeredFX Twilio number.'},
 email:{label:'Email',detail:'Through LayeredFX email (Resend).'},
 phone:{label:'Phone calls',detail:'xAI Voice through a SIP trunk.'},
 web_chat:{label:'Website chat',detail:'A chat window on layeredfx.com.'},
};
const MODES:SkillMode[]=['off','draft','approval'];
const MODE_LABEL:Record<SkillMode,string>={off:'Off',draft:'Drafts only',approval:'Needs approval'};
const STATUS_LABEL:Record<AssignmentStatus,string>={queued:'Queued',in_progress:'In progress',needs_review:'Needs review',done:'Done',canceled:'Canceled'};
const OPEN_STATUSES:AssignmentStatus[]=['queued','in_progress','needs_review'];
// Voices listed in the xAI Voice Agent API docs.
const XAI_VOICES=['eve','ara','leo','rex','sal','carina','zagan','helix','orion','luna','iris','altair','zenith','perseus','helios','lux','kepler','rigel','cosmo','celeste','ursa','sirius','lumen','castor','naksh','atlas'];

function useConnections(demo:boolean){
 const [connections,setConnections]=useState<AgentConnection[]|null>(null);const [error,setError]=useState(demo?'Connection status is checked on the deployed site. The local demo has no server keys.':'');
 useEffect(()=>{if(demo)return;let live=true;
  fetch('/api/operations/agents',{cache:'no-store'}).then(async res=>{const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||'Connection status is unavailable.');if(live)setConnections(data.connections);})
   .catch(e=>{if(live)setError(e instanceof Error?e.message:'Connection status is unavailable.');});
  return()=>{live=false;};
 },[demo]);
 return {connections,error};
}

function ConnectionBadge({connection,error}:{connection?:AgentConnection;error:string}){
 if(error)return <span className="ag-status is-unknown"><CircleDashed size={13} aria-hidden/>Status unavailable</span>;
 if(!connection)return <span className="ag-status is-unknown"><CircleDashed size={13} aria-hidden/>Checking…</span>;
 return connection.configured
  ?<span className="ag-status is-set" title="The server variables are set. The connection itself has not been tested."><KeyRound size={13} aria-hidden/>Keys set · not verified</span>
  :<span className="ag-status is-missing"><CircleDashed size={13} aria-hidden/>Not connected</span>;
}

export function AgentsPage(){
 const {state,actor,dispatch,busy,mode}=useOperations();const admin=actor.role==='admin';const canAssign=actor.role!=='viewer';
 const [tab,setTab]=useState('Overview');const [agentId,setAgentId]=useState<AgentId>('eve');
 const {connections,error}=useConnections(mode==='demo');
 const agents=useMemo(()=>agentsFor(state),[state]);
 const agent=agents.find(a=>a.id===agentId)||agents[0];
 const docs=state.agentDocs||[];const assignments=state.agentAssignments||[];
 const openTab=(id:AgentId,next:string)=>{setAgentId(id);setTab(next);};
 const picker=<div className="ag-picker"><span className="ops-muted">Agent</span><Views values={agents.map(a=>a.name)} value={agent.name} onChange={name=>setAgentId(agents.find(a=>a.name===name)?.id||'eve')}/></div>;
 return <>
  <PageTitle eyebrow="LAYEREDFX / SYSTEM" title="AI Agents" description="Eve, Paperclip agent teams and the voice agent: channels, skills, training documents and assignments.">
   {canAssign&&<Button onClick={()=>setTab('Assignments')}><Plus size={16}/>Assign work</Button>}
  </PageTitle>
  <p className="ops-info ag-notice">Agents don’t run from this dashboard yet. Setup, skills, training documents and assignments are saved here, ready for the Hermes, Paperclip and xAI connections. Nothing is sent to an agent, and no agent sends messages from LayeredFX.</p>
  {!admin&&<p className="ops-info">Only administrators can change agent setup, skills and training documents.</p>}
  <div className="ops-toolbar ag-tabs"><Views values={TABS} value={tab} onChange={setTab}/></div>
  {tab==='Overview'&&<Overview agents={agents} connections={connections} error={error} docs={docs} assignments={assignments} onOpen={openTab}/>}
  {tab==='Communication'&&<>{picker}<CommunicationTab key={agent.id} agent={agent} admin={admin} busy={busy} people={state.people} dispatch={dispatch}/></>}
  {tab==='Skills'&&<>{picker}<SkillsTab key={agent.id} agent={agent} admin={admin} busy={busy} dispatch={dispatch}/></>}
  {tab==='Training docs'&&<DocsTab docs={docs} agents={agents} admin={admin} busy={busy} dispatch={dispatch}/>}
  {tab==='Assignments'&&<AssignmentsTab agents={agents} defaultAgent={agent.id} assignments={assignments} deals={state.deals.filter(d=>!d.archivedAt).map(d=>({id:d.id,name:d.name}))} actorId={actor.id} admin={admin} canAssign={canAssign} busy={busy} dispatch={dispatch}/>}
  {tab==='Setup'&&<SetupTab connections={connections} error={error}/>}
 </>;
}

function Overview({agents,connections,error,docs,assignments,onOpen}:{agents:AgentView[];connections:AgentConnection[]|null;error:string;docs:AgentDoc[];assignments:AgentAssignment[];onOpen:(id:AgentId,tab:string)=>void}){
 return <>
  <div className="ag-grid">{agents.map(a=>{
   const Icon=AGENT_ICON[a.id];
   const skills=Object.values(a.skills).filter(m=>m!=='off').length;
   const docCount=docs.filter(d=>d.status==='active'&&d.agents.includes(a.id)).length;
   const openCount=assignments.filter(x=>x.agent===a.id&&OPEN_STATUSES.includes(x.status)).length;
   return <article key={a.id} className={`ops-panel ag-card${a.id==='eve'?' is-main':''}`}>
    <div className="ag-card-head"><span className="ag-icon" aria-hidden><Icon size={22}/></span><div className="ag-card-name">
     <div className="ag-card-title"><h2>{a.name}</h2>{a.id==='eve'&&<span className="ag-chip is-volt">Main agent</span>}</div><p>{a.role}</p></div></div>
    <div className="ag-meta"><span className="ag-chip">{a.platform}</span><ConnectionBadge connection={connections?.find(c=>c.id===a.id)} error={error}/><span className={`ag-chip${a.enabled?'':' is-muted'}`}>{a.enabled?'In use':'Not in use'}</span></div>
    {a.endpoint?<a className="ag-link" href={a.endpoint} target="_blank" rel="noreferrer">{a.endpoint.replace(/^https:\/\//,'')}<ArrowUpRight size={14} aria-hidden/></a>:<span className="ag-link is-plain">Runs through the xAI Voice API</span>}
    <dl className="ag-counts"><div><dt>Skills on</dt><dd>{skills}</dd></div><div><dt>Training docs</dt><dd>{docCount}</dd></div><div><dt>Open work</dt><dd>{openCount}</dd></div></dl>
    <div className="ag-card-actions">
     <Button size="sm" variant="outline" onClick={()=>onOpen(a.id,'Communication')}><MessageSquare size={14}/>Channels</Button>
     <Button size="sm" variant="outline" onClick={()=>onOpen(a.id,'Skills')}><Sparkles size={14}/>Skills</Button>
     <Button size="sm" onClick={()=>onOpen(a.id,'Assignments')}><ClipboardList size={14}/>Assign</Button>
    </div>
   </article>;
  })}</div>
  <Panel title="How the agents work together">
   <ol className="ag-flow">
    <li><b>Eve</b><span>Main assistant on Hermes Agent with OpenAI models. Takes requests from you and the team, drafts replies and keeps the day on track.</span></li>
    <li><b>Paperclip teams</b><span>Bigger jobs that you or Eve hand off, such as content, research, quotes and project prep, split across agent teams.</span></li>
    <li><b>Voice agent</b><span>Answers calls with xAI Voice, captures caller details and summarizes each call.</span></li>
    <li><b>LayeredFX</b><span>Assignments, approvals and results come back here. Skills can only draft or wait for approval.</span></li>
   </ol>
   <p className="ops-muted ag-flow-note">This is the planned setup. The connections between LayeredFX and each service are not built yet.</p>
  </Panel>
 </>;
}

function CommunicationTab({agent,admin,busy,people,dispatch}:{agent:AgentView;admin:boolean;busy:boolean;people:{id:string;name:string}[];dispatch:Dispatch}){
 const [channels,setChannels]=useState(agent.channels);const [escalateTo,setEscalateTo]=useState(agent.escalateTo||'');
 const [voiceName,setVoiceName]=useState(agent.voiceName||'');const [greeting,setGreeting]=useState(agent.greeting||'');
 const [enabled,setEnabled]=useState(agent.enabled);
 const save=()=>void dispatch({type:'agent.save',id:agent.id,patch:{enabled,channels,escalateTo,...(agent.id==='voice'?{voiceName,greeting}:{})}});
 return <div className="ag-columns">
  <Panel title={`${agent.name} channels`}>
   <label className="ops-switch ag-enabled"><input type="checkbox" role="switch" checked={enabled} disabled={!admin} onChange={e=>setEnabled(e.target.checked)}/><span aria-hidden/>{enabled?`${agent.name} is in use`:`${agent.name} is not in use`}</label>
   <p className="ops-muted">Where {agent.name} may talk with customers and the team once connected. Messages would go out through LayeredFX’s own Twilio and email setup.</p>
   <ul className="ag-rows">{AGENT_CHANNELS.map(ch=><li key={ch}><div><b>{CHANNEL_INFO[ch].label}</b><span>{CHANNEL_INFO[ch].detail}</span></div>
    <label className="ops-switch"><input type="checkbox" role="switch" aria-label={`${CHANNEL_INFO[ch].label} for ${agent.name}`} checked={Boolean(channels[ch])} disabled={!admin} onChange={e=>setChannels({...channels,[ch]:e.target.checked})}/><span aria-hidden/>{channels[ch]?'Allowed':'Off'}</label></li>)}</ul>
  </Panel>
  <div className="ag-stack">
   <Panel title="Hand-off and escalation">
    <Field label="Escalate to"><BrandedSelect aria-label="Escalate to" value={escalateTo} disabled={!admin} onChange={e=>setEscalateTo(e.target.value)}><option value="">No one selected</option>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</BrandedSelect></Field>
    <p className="ops-muted">The team member who reviews drafts, approvals and anything {agent.name} can’t answer.</p>
    {agent.id==='voice'&&<>
     <Field label="Voice"><BrandedSelect aria-label="Voice" value={voiceName} disabled={!admin} onChange={e=>setVoiceName(e.target.value)}><option value="">Choose a voice</option>{XAI_VOICES.map(v=><option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</BrandedSelect></Field>
     <Field label="Call greeting"><textarea rows={3} maxLength={500} value={greeting} disabled={!admin} placeholder={`Thanks for calling ${business.name}…`} onChange={e=>setGreeting(e.target.value)}/></Field>
    </>}
   </Panel>
   <Panel title="Conversation history"><Empty>Conversations will appear here once the {agent.platform} connection is built. Nothing has been sent or received yet.</Empty></Panel>
  </div>
  {admin&&<div className="ag-save"><Button onClick={save} disabled={busy}><Check size={16}/>Save {agent.name} communication</Button></div>}
 </div>;
}

function SkillsTab({agent,admin,busy,dispatch}:{agent:AgentView;admin:boolean;busy:boolean;dispatch:Dispatch}){
 const available=AGENT_SKILLS.filter(s=>s.agents.includes(agent.id));
 const [skills,setSkills]=useState<Record<string,SkillMode>>(agent.skills);const [instructions,setInstructions]=useState(agent.instructions||'');
 return <div className="ag-columns">
  <Panel title={`${agent.name} skills`}>
   <p className="ops-muted"><b>Drafts only:</b> {agent.name} prepares work for a person to send. <b>Needs approval:</b> {agent.name} may act only after a team member approves. There is no fully automatic mode.</p>
   <ul className="ag-rows">{available.map(s=>{const mode=skills[s.id]||'off';return <li key={s.id}><div><b>{s.label}</b><span>{s.description}</span></div>
    <div className="ops-views ag-modes" role="radiogroup" aria-label={`${s.label} mode`}>{MODES.map(m=><button type="button" key={m} role="radio" aria-checked={mode===m} className={mode===m?'active':''} disabled={!admin} onClick={()=>setSkills({...skills,[s.id]:m})}>{MODE_LABEL[m]}</button>)}</div></li>;})}</ul>
  </Panel>
  <Panel title="Instructions">
   <Field label={`How ${agent.name} should work`}><textarea rows={12} maxLength={8000} value={instructions} disabled={!admin} placeholder="Tone, what to avoid, when to hand off to a person…" onChange={e=>setInstructions(e.target.value)}/></Field>
   <p className="ops-muted">{instructions.length.toLocaleString()}/8,000 characters. Keep business facts in Training docs so every agent shares them.</p>
  </Panel>
  {admin&&<div className="ag-save"><Button onClick={()=>void dispatch({type:'agent.save',id:agent.id,patch:{skills,instructions}})} disabled={busy}><Check size={16}/>Save {agent.name} skills</Button></div>}
 </div>;
}

type DocDraft={title:string;category:string;kind:'note'|'link';url:string;body:string;agents:AgentId[];status:AgentDoc['status']};
const emptyDoc=():DocDraft=>({title:'',category:'',kind:'note',url:'',body:'',agents:['eve','paperclip','voice'],status:'active'});
const SUGGESTED_DOCS:{title:string;category:string;body?:()=>string}[]=[
 {title:'Business profile',category:'Company',body:()=>[business.name,`Phone: ${business.phone.display}`,`Text: ${business.sms.display}`,`Email: ${business.email}`,`Office: ${businessAddressLine}`,`Hours: ${businessHoursLine}`,'',business.description].join('\n')},
 {title:'Services and pricing guide',category:'Sales'},
 {title:'Brand voice',category:'Brand'},
 {title:'Frequently asked questions',category:'Support'},
 {title:'Booking and consultation policy',category:'Operations'},
];

function DocsTab({docs,agents,admin,busy,dispatch}:{docs:AgentDoc[];agents:AgentView[];admin:boolean;busy:boolean;dispatch:Dispatch}){
 const [filter,setFilter]=useState('All');const [editing,setEditing]=useState<{id?:string;draft:DocDraft}|null>(null);
 const nameOf=(id:AgentId)=>agents.find(a=>a.id===id)?.name||id;
 const filterId=agents.find(a=>a.name===filter)?.id;
 const shown=[...docs].filter(d=>!filterId||d.agents.includes(filterId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 const missing=SUGGESTED_DOCS.filter(s=>!docs.some(d=>d.title.toLowerCase()===s.title.toLowerCase()));
 async function save(){if(!editing)return;const id=await dispatch({type:'agent.doc.save',id:editing.id,patch:editing.draft});if(id)setEditing(null);}
 const put=(patch:Partial<DocDraft>)=>setEditing(e=>e&&{...e,draft:{...e.draft,...patch}});
 return <>
  <div className="ops-toolbar"><Views values={['All',...agents.map(a=>a.name)]} value={filter} onChange={setFilter}/>{admin&&<Button onClick={()=>setEditing({draft:emptyDoc()})}><Plus size={16}/>Add document</Button>}</div>
  {admin&&!!missing.length&&<Panel title="Suggested documents"><p className="ops-muted">Agents answer better with the same facts your team uses. Start one of these; the business profile is filled in from your website details.</p>
   <div className="ag-suggest">{missing.map(s=><Button key={s.title} size="sm" variant="outline" onClick={()=>setEditing({draft:{...emptyDoc(),title:s.title,category:s.category,body:s.body?.()||''}})}><BookOpen size={14}/>{s.title}</Button>)}</div></Panel>}
  {!shown.length?<Empty>{docs.length?'No documents for this agent.':'No training documents yet.'}</Empty>:<div className="ops-table-wrap"><table className="ops-table">
   <thead><tr><th>Document</th><th>Agents</th><th>Status</th><th>Updated</th>{admin&&<th><span className="sr-only">Actions</span></th>}</tr></thead>
   <tbody>{shown.map(d=><tr key={d.id}>
    <td><b>{d.title}</b><small>{[d.category,d.kind==='link'?'Link':'Notes'].filter(Boolean).join(' · ')}</small></td>
    <td><div className="ag-chips">{d.agents.map(id=><span key={id} className="ag-chip">{nameOf(id)}</span>)}</div></td>
    <td><span className={`ag-chip is-cap${d.status==='active'?' is-volt':' is-muted'}`}>{d.status}</span></td>
    <td className="whitespace-nowrap">{dateLabel(d.updatedAt)}</td>
    {admin&&<td><div className="ag-row-actions">
     {d.kind==='link'&&<Button asChild size="icon" variant="ghost"><a href={d.url} target="_blank" rel="noreferrer" aria-label={`Open ${d.title}`}><ArrowUpRight size={15}/></a></Button>}
     <Button size="icon" variant="ghost" aria-label={`Edit ${d.title}`} onClick={()=>setEditing({id:d.id,draft:{title:d.title,category:d.category,kind:d.kind,url:d.url,body:d.body,agents:d.agents,status:d.status}})}><Pencil size={15}/></Button>
     <Button size="icon" variant="ghost" aria-label={`Remove ${d.title}`} disabled={busy} onClick={()=>{if(confirm(`Remove "${d.title}" from the training library?`))void dispatch({type:'agent.doc.delete',id:d.id});}}><Trash2 size={15}/></Button>
    </div></td>}
   </tr>)}</tbody>
  </table></div>}
  <Modal title={editing?.id?'Edit training document':'Add training document'} description="Shared facts and guidance for the agents. Don't include passwords, API keys or customer payment details." open={Boolean(editing)} onClose={()=>setEditing(null)}>
   {editing&&<form className="ag-form" onSubmit={e=>{e.preventDefault();void save();}}>
    <div className="ag-form-grid">
     <Field label="Title"><BrandedInput required maxLength={150} value={editing.draft.title} onChange={e=>put({title:e.target.value})}/></Field>
     <Field label="Category"><BrandedInput maxLength={60} value={editing.draft.category} placeholder="Sales, Support, Brand…" onChange={e=>put({category:e.target.value})}/></Field>
    </div>
    <div className="ops-views" role="radiogroup" aria-label="Document type">{(['note','link'] as const).map(k=><button type="button" key={k} role="radio" aria-checked={editing.draft.kind===k} className={editing.draft.kind===k?'active':''} onClick={()=>put({kind:k})}>{k==='note'?'Write notes':'Link a document'}</button>)}</div>
    {editing.draft.kind==='link'
     ?<Field label="Document link (https)"><BrandedInput type="url" required maxLength={1000} value={editing.draft.url} placeholder="https://docs.google.com/…" onChange={e=>put({url:e.target.value})}/></Field>
     :<Field label="Notes"><textarea required rows={10} maxLength={20000} value={editing.draft.body} onChange={e=>put({body:e.target.value})}/></Field>}
    <fieldset className="ag-fieldset"><legend>Used by</legend>{agents.map(a=><label key={a.id} className="ag-check"><input type="checkbox" checked={editing.draft.agents.includes(a.id)} onChange={e=>put({agents:e.target.checked?[...editing.draft.agents,a.id]:editing.draft.agents.filter(x=>x!==a.id)})}/>{a.name}</label>)}</fieldset>
    <Field label="Status"><BrandedSelect aria-label="Status" value={editing.draft.status} onChange={e=>put({status:e.target.value as DocDraft['status']})}><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></BrandedSelect></Field>
    <div className="ag-form-actions"><Button type="button" variant="outline" onClick={()=>setEditing(null)}>Cancel</Button><Button type="submit" disabled={busy}><Check size={16}/>Save document</Button></div>
   </form>}
  </Modal>
 </>;
}

type AssignDraft={title:string;agent:AgentId;priority:AgentAssignment['priority'];dueDate:string;dealId:string;details:string};

function AssignmentsTab({agents,defaultAgent,assignments,deals,actorId,admin,canAssign,busy,dispatch}:{agents:AgentView[];defaultAgent:AgentId;assignments:AgentAssignment[];deals:{id:string;name:string}[];actorId:string;admin:boolean;canAssign:boolean;busy:boolean;dispatch:Dispatch}){
 const blank=(agent:AgentId):AssignDraft=>({title:'',agent,priority:'medium',dueDate:'',dealId:'',details:''});
 const [draft,setDraft]=useState<AssignDraft>(()=>blank(defaultAgent));
 const [agentFilter,setAgentFilter]=useState('All');const [statusFilter,setStatusFilter]=useState('Open');
 const nameOf=(id:AgentId)=>agents.find(a=>a.id===id)?.name||id;
 const filterId=agents.find(a=>a.name===agentFilter)?.id;
 const shown=assignments.filter(a=>(!filterId||a.agent===filterId)&&(statusFilter==='All'||(statusFilter==='Open'?OPEN_STATUSES.includes(a.status):!OPEN_STATUSES.includes(a.status))))
  .sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')||b.createdAt.localeCompare(a.createdAt));
 async function create(e:React.FormEvent){e.preventDefault();const id=await dispatch({type:'agent.assign',patch:draft});if(id)setDraft(blank(draft.agent));}
 return <div className="ag-assign-layout">
  {canAssign&&<Panel title="Assign work">
   <form className="ag-form" onSubmit={e=>void create(e)}>
    <Field label="What needs doing"><BrandedInput required maxLength={200} value={draft.title} placeholder="Draft replies to this week's reviews" onChange={e=>setDraft({...draft,title:e.target.value})}/></Field>
    <div className="ag-form-grid">
     <Field label="Agent"><BrandedSelect aria-label="Agent" value={draft.agent} onChange={e=>setDraft({...draft,agent:e.target.value as AgentId})}>{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</BrandedSelect></Field>
     <Field label="Priority"><BrandedSelect aria-label="Priority" value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value as AssignDraft['priority']})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></BrandedSelect></Field>
     <Field label="Due date"><BrandedInput type="date" value={draft.dueDate} onChange={e=>setDraft({...draft,dueDate:e.target.value})}/></Field>
     <Field label="Opportunity"><BrandedSelect aria-label="Opportunity" value={draft.dealId} onChange={e=>setDraft({...draft,dealId:e.target.value})}><option value="">None</option>{deals.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</BrandedSelect></Field>
    </div>
    <Field label="Details"><textarea rows={4} maxLength={4000} value={draft.details} placeholder="Context, links and what a good result looks like" onChange={e=>setDraft({...draft,details:e.target.value})}/></Field>
    <p className="ops-muted">Saved to the queue below. It isn’t sent to {nameOf(draft.agent)} until the connection is built.</p>
    <div className="ag-form-actions"><Button type="submit" disabled={busy||!draft.title.trim()}><Plus size={16}/>Add to queue</Button></div>
   </form>
  </Panel>}
  <div>
   <div className="ops-toolbar"><Views values={['All',...agents.map(a=>a.name)]} value={agentFilter} onChange={setAgentFilter}/><Views values={['Open','Closed','All']} value={statusFilter} onChange={setStatusFilter}/></div>
   {!shown.length?<Empty>{assignments.length?'No assignments match these filters.':'No assignments yet.'}</Empty>
    :<ul className="ops-panel ag-assignments">{shown.map(item=><AssignmentRow key={item.id} item={item} agentName={nameOf(item.agent)} dealName={deals.find(d=>d.id===item.dealId)?.name||''} canEdit={admin||item.createdBy===actorId} busy={busy} dispatch={dispatch}/>)}</ul>}
  </div>
 </div>;
}

function AssignmentRow({item,agentName,dealName,canEdit,busy,dispatch}:{item:AgentAssignment;agentName:string;dealName:string;canEdit:boolean;busy:boolean;dispatch:Dispatch}){
 const [note,setNote]=useState('');
 return <li className="ag-assignment">
  <div className="ag-assignment-main">
   <div className="ag-assignment-title"><b>{item.title}</b><span className={`ag-chip is-cap is-${item.priority}`}>{item.priority}</span><span className="ag-chip">{STATUS_LABEL[item.status]}</span></div>
   <p className="ops-muted">{agentName} · {item.dueDate?`Due ${dateLabel(item.dueDate)}`:'No due date'}{dealName?` · ${dealName}`:''} · Assigned by {item.createdByName}</p>
   {item.details&&<p className="ag-details">{item.details}</p>}
   <details className="ag-log"><summary>History ({item.log.length})</summary><ul>{item.log.map((entry,i)=><li key={i}><time dateTime={entry.at}>{dateLabel(entry.at)}</time> {entry.actorName}: {entry.text}</li>)}</ul></details>
  </div>
  {canEdit&&<div className="ag-assignment-side">
   <BrandedSelect aria-label={`Status of ${item.title}`} value={item.status} disabled={busy} onChange={e=>void dispatch({type:'agent.assignment.update',id:item.id,status:e.target.value})}>{ASSIGNMENT_STATUSES.map(s=><option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</BrandedSelect>
   <form className="ag-note" onSubmit={async e=>{e.preventDefault();if(!note.trim())return;if(await dispatch({type:'agent.assignment.update',id:item.id,note}))setNote('');}}>
    <BrandedInput aria-label={`Note for ${item.title}`} value={note} maxLength={1000} placeholder="Add a note" onChange={e=>setNote(e.target.value)}/>
    <Button type="submit" size="sm" variant="outline" disabled={busy||!note.trim()}>Add</Button>
   </form>
   <Button size="icon" variant="ghost" aria-label={`Remove ${item.title}`} disabled={busy} onClick={()=>{if(confirm(`Remove "${item.title}"?`))void dispatch({type:'agent.assignment.delete',id:item.id});}}><Trash2 size={15}/></Button>
  </div>}
 </li>;
}

// Copy-paste blocks for Coolify. Values are placeholders; comments are left out because each line becomes a variable.
export const COOLIFY_ENV={
 layeredfx:['LFX_HERMES_URL=https://agent.layeredfx.com','LFX_HERMES_API_KEY=','LFX_HERMES_MODEL=hermes-agent','LFX_PAPERCLIP_URL=https://team.layeredfx.com','LFX_PAPERCLIP_API_KEY=','LFX_PAPERCLIP_COMPANY_ID=','LFX_PAPERCLIP_AGENT_ID=','LFX_XAI_API_KEY=','LFX_XAI_VOICE_MODEL=grok-voice-latest','LFX_XAI_VOICE=eve'].join('\n'),
 hermes:['OPENAI_API_KEY=','API_SERVER_ENABLED=true','API_SERVER_KEY=','API_SERVER_HOST=0.0.0.0','API_SERVER_PORT=8642','HERMES_DASHBOARD_BASIC_AUTH_USERNAME=','HERMES_DASHBOARD_BASIC_AUTH_PASSWORD=','GATEWAY_ALLOW_ALL_USERS=false'].join('\n'),
 hermesConfig:['model:','  provider: openai-api','  default: YOUR_OPENAI_MODEL'].join('\n'),
 paperclip:['PAPERCLIP_PUBLIC_URL=https://team.layeredfx.com','PAPERCLIP_DEPLOYMENT_MODE=authenticated','PAPERCLIP_DEPLOYMENT_EXPOSURE=public','PAPERCLIP_ALLOWED_HOSTNAMES=team.layeredfx.com','HOST=0.0.0.0','BETTER_AUTH_SECRET=','PAPERCLIP_TOOL_ACTION_SIGNING_SECRET=','DATABASE_URL=','OPENAI_API_KEY=','PAPERCLIP_TELEMETRY_DISABLED=1'].join('\n'),
};

function CopyBlock({title,description,text}:{title:string;description:string;text:string}){
 const [copied,setCopied]=useState(false);
 return <div className="ag-env">
  <div className="ag-env-head"><div><b>{title}</b><span>{description}</span></div>
   <Button size="sm" variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{/* select the text manually */}}}><Copy size={14}/>{copied?'Copied':'Copy'}</Button></div>
  <pre tabIndex={0}>{text}</pre>
 </div>;
}

const SERVICE_LABEL:Record<AgentId,string>={eve:'Eve · Hermes Agent',paperclip:'Paperclip teams',voice:'Voice agent · xAI'};

function SetupTab({connections,error}:{connections:AgentConnection[]|null;error:string}){
 return <>
  <Panel title="LayeredFX connection status">
   <p className="ops-muted">Checks whether the LayeredFX app has each variable. It never shows values, and a set key isn’t a tested connection.</p>
   {error&&<p className="ops-info" role="status">{error}</p>}
   <div className="ag-grid">{(Object.keys(AGENT_ENV) as AgentId[]).map(id=>{const c=connections?.find(x=>x.id===id);const spec=AGENT_ENV[id];
    return <div key={id} className="ag-vars"><div className="ag-vars-head"><b>{SERVICE_LABEL[id]}</b><ConnectionBadge connection={c} error={error}/></div>
     <ul>{[...spec.required.map(name=>({name,required:true})),...spec.optional.map(name=>({name,required:false}))].map(v=>{const missing=c?(v.required?c.missing:c.optionalMissing).includes(v.name):null;
      return <li key={v.name}><code>{v.name}</code><span className={missing===null?'is-unknown':missing?(v.required?'is-missing':'is-optional'):'is-set'}>{missing===null?'—':missing?(v.required?'Missing':'Optional'):'Set'}</span></li>;})}</ul></div>;})}</div>
  </Panel>
  <div className="ag-columns">
   <CopyBlock title="LayeredFX app" description="Coolify › LayeredFX › Environment Variables. Fill in the keys, then redeploy. LFX_HERMES_API_KEY is the same value as API_SERVER_KEY in the Hermes app." text={COOLIFY_ENV.layeredfx}/>
   <CopyBlock title="Hermes Agent app (agent.layeredfx.com)" description="Image nousresearch/hermes-agent, command gateway run, persistent volume at /opt/data. Route the domain to port 8642." text={COOLIFY_ENV.hermes}/>
   <CopyBlock title="Hermes config.yaml" description="Hermes picks its model in /opt/data/config.yaml, not an env variable. Use the OpenAI model you want Eve on." text={COOLIFY_ENV.hermesConfig}/>
   <CopyBlock title="Paperclip app (team.layeredfx.com)" description="Build from github.com/paperclipai/paperclip with a persistent volume. Route the domain to port 3100." text={COOLIFY_ENV.paperclip}/>
  </div>
  <Panel title="Before you connect">
   <ul className="ag-checklist">
    <li>Generate long random values for API_SERVER_KEY, BETTER_AUTH_SECRET and PAPERCLIP_TOOL_ACTION_SIGNING_SECRET. Never reuse Channel Cast or ControlP secrets.</li>
    <li>Keep the Hermes dashboard (port 9119) off, or behind its basic-auth login. Leave GATEWAY_ALLOW_ALL_USERS=false.</li>
    <li>Create a Paperclip agent API key in Paperclip for LFX_PAPERCLIP_API_KEY, and copy your company id for LFX_PAPERCLIP_COMPANY_ID.</li>
    <li>Paperclip’s built-in Hermes adapter only works when Hermes runs on the same server. With separate Coolify apps, Paperclip and Eve connect through their HTTP APIs instead.</li>
    <li>Keep LFX_XAI_API_KEY server-side only. Phone calls use an xAI SIP number, for example through a Twilio Elastic SIP trunk.</li>
    <li>The LayeredFX connections to Hermes, Paperclip and xAI still need to be built. Setting these variables only changes the status above.</li>
   </ul>
  </Panel>
 </>;
}
