"use client";
// Jobs: the installation workflow, laid out like the Pipeline. Stage moves always go through the job.stage command.
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowLeft,ArrowRight,CheckCircle2,Clock3,MapPin,NotebookPen,Plus,Settings2,UserRound,Users} from 'lucide-react';
import {DEFAULT_JOB_STAGES,JOB_LABELS,JOB_PATH,JOB_STAGES,SERVICES} from '@/lib/operations/defaults.mjs';
import {jobDays,jobGuide,jobLabel,jobNeedsNext,jobSteps} from '@/lib/operations/jobs.mjs';
import {offsetDate,today,uid} from '@/lib/operations/engine.mjs';
import type {Job,JobStage,JobStageGuide} from '@/lib/operations/types';
import {useOperations} from './provider';
import {BrandedInput,BrandedSelect} from './branded-fields';
import {Button,Calendar,dateLabel,DownloadButton,Empty,Field,Modal,money,PageTitle,Panel,SearchBox,Views} from './shared';
import {JobDailyLogs} from './daily-logs';
const closedStage=(s:JobStage)=>s==='complete'||s==='cancelled';
function JobStageBadge({stage}:{stage:JobStage}){const {state}=useOperations();return <span className={`ops-badge jobstage-${stage}`}>{jobLabel(state,stage)}</span>;}

export function JobMoveDialog({job,target,onClose}:{job:Job;target:JobStage;onClose:()=>void}){
 const {state,actor,dispatch}=useOperations();const [stage,setStage]=useState<JobStage>(target);const [reason,setReason]=useState(''),[holdReason,setHold]=useState(''),[cancelReason,setCancel]=useState(''),[overrideReason,setOverride]=useState('');
 const reopening=closedStage(job.stage)&&stage!==job.stage;
 return <Modal open onClose={onClose} title="Move job" description="Required steps are checked the same way from the board, the job page and the server."><form onSubmit={async e=>{e.preventDefault();if(await dispatch({type:'job.stage',id:job.id,stage,reason,holdReason,cancelReason,overrideReason}))onClose();}}>
  <Field label="Destination stage"><BrandedSelect value={stage} onChange={e=>setStage(e.target.value as JobStage)}>{JOB_STAGES.map(s=><option key={s} value={s}>{jobLabel(state,s)}</option>)}</BrandedSelect></Field>
  <Field label={reopening?'Reopen reason (required)':'Transition note'}><textarea required={reopening} value={reason} onChange={e=>setReason(e.target.value)}/></Field>
  {stage==='on_hold'&&<Field label="Why is the job on hold?"><textarea required value={holdReason} onChange={e=>setHold(e.target.value)} placeholder="e.g. Waiting on HOA approval"/></Field>}
  {stage==='cancelled'&&<Field label="Cancellation reason"><textarea required value={cancelReason} onChange={e=>setCancel(e.target.value)}/></Field>}
  {actor.role==='admin'&&<details><summary>Administrator checklist override</summary><p className="ops-muted">Only for a justified exception. The reason is recorded in the job history.</p><Field label="Override reason (optional)"><textarea value={overrideReason} onChange={e=>setOverride(e.target.value)}/></Field></details>}
  <div className="ops-actions"><Button type="submit">Move job <ArrowRight size={16}/></Button><Button variant="outline" onClick={onClose}>Cancel</Button></div>
 </form></Modal>;
}

function JobForm({job,opportunityId,onClose}:{job?:Job;opportunityId?:string;onClose:()=>void}){
 const {state,actor,dispatch}=useOperations();const router=useRouter();const deal=opportunityId?state.deals.find(d=>d.id===opportunityId):undefined;
 const workers=state.people.filter(p=>p.role!=='viewer');
 const [draft,setDraft]=useState({name:job?.name||deal?.name||'',client:'',email:'',phone:'',contactId:'',owner:job?.owner||deal?.owner||actor.id,value:job?.value??deal?.value??0,address:job?.address||'',startDate:job?.startDate||'',targetDate:job?.targetDate||'',services:job?.services||deal?.products||[],crew:job?.crew||[],notes:job?.notes||''});
 const set=(patch:Partial<typeof draft>)=>setDraft({...draft,...patch});
 const toggle=(key:'services'|'crew',value:string,on:boolean)=>set({[key]:on?[...draft[key],value]:draft[key].filter(x=>x!==value)});
 async function submit(e:React.FormEvent){e.preventDefault();const {client,email,phone,contactId,...fields}=draft;
  const id=await dispatch(job?{type:'job.update',id:job.id,patch:fields}:{type:'job.create',...fields,opportunityId,...(deal?{}:contactId?{contactId}:{client,email,phone})});
  if(id){onClose();if(!job)router.push(`/admin/jobs/${id}`);}}
 const clients=state.contacts.filter(c=>c.status!=='archived');
 return <Modal open onClose={onClose} title={job?'Edit job':deal?`Create job from ${deal.name}`:'New job'} description={deal?'The won opportunity’s client, value and services carry over. Creating it again opens the same job.':'Jobs start in Handoff.'}><form onSubmit={e=>void submit(e)}>
  <div className="ops-form-grid">
   <Field label="Job name"><BrandedInput required value={draft.name} onChange={e=>set({name:e.target.value})}/></Field>
   <Field label="Owner"><BrandedSelect value={draft.owner} onChange={e=>set({owner:e.target.value})}>{workers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</BrandedSelect></Field>
   {!job&&!deal&&<><Field label="Existing client"><BrandedSelect value={draft.contactId} onChange={e=>set({contactId:e.target.value})}><option value="">New client…</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.company?` · ${c.company}`:''}</option>)}</BrandedSelect></Field>
    {!draft.contactId&&<><Field label="Client name"><BrandedInput required value={draft.client} onChange={e=>set({client:e.target.value})}/></Field><Field label="Client email"><BrandedInput type="email" value={draft.email} onChange={e=>set({email:e.target.value})}/></Field><Field label="Client phone"><BrandedInput value={draft.phone} onChange={e=>set({phone:e.target.value})}/></Field></>}</>}
   <Field label="Site address"><BrandedInput value={draft.address} onChange={e=>set({address:e.target.value})}/></Field>
   <Field label="Job value ($)"><BrandedInput type="number" min="0" step="0.01" value={draft.value} onChange={e=>set({value:Number(e.target.value)})}/></Field>
   <Field label="Start date"><BrandedInput type="date" value={draft.startDate} onChange={e=>set({startDate:e.target.value})}/></Field>
   <Field label="Target completion"><BrandedInput type="date" value={draft.targetDate} onChange={e=>set({targetDate:e.target.value})}/></Field>
  </div>
  <h3>Services</h3><div className="ops-checkgrid">{SERVICES.map(s=><label key={s}><BrandedInput type="checkbox" checked={draft.services.includes(s)} onChange={e=>toggle('services',s,e.target.checked)}/>{s}</label>)}</div>
  <h3>Crew</h3><div className="ops-checkgrid">{workers.map(p=><label key={p.id}><BrandedInput type="checkbox" checked={draft.crew.includes(p.id)} onChange={e=>toggle('crew',p.id,e.target.checked)}/>{p.name}</label>)}</div>
  <Field label="Notes"><textarea value={draft.notes} onChange={e=>set({notes:e.target.value})}/></Field>
  <Button type="submit">{job?'Save changes':'Create job'}</Button>
 </form></Modal>;
}

/** Won opportunities that have no job yet. */
function Handoffs(){
 const {state,actor}=useOperations();const [creating,setCreating]=useState<string|null>(null);
 const ready=state.deals.filter(d=>d.stage==='closed_won'&&!d.archivedAt&&!(state.jobs||[]).some(j=>j.opportunityId===d.id));
 if(!ready.length)return null;
 return <Panel title="Ready for handoff"><p className="ops-muted">Won opportunities without a job. Creating the job carries over the client, value and services.</p>{ready.map(d=><div className="ops-record-row" key={d.id}><div><b>{d.name}</b><small>{d.client} · {money(d.value)}</small></div><Button size="sm" disabled={actor.role==='viewer'||!!creating} onClick={()=>setCreating(d.id)}>Create job</Button></div>)}
  {creating&&<JobForm opportunityId={creating} onClose={()=>setCreating(null)}/>}</Panel>;
}

export function JobsPage(){
 const {state,actor}=useOperations();const router=useRouter();const [view,setView]=useState('board');const [q,setQ]=useState('');const [owner,setOwner]=useState('all');const [stageFilter,setStageFilter]=useState('all');const [archived,setArchived]=useState(false);const [creating,setCreating]=useState(false);const [move,setMove]=useState<{job:Job;stage:JobStage}|null>(null);
 useEffect(()=>{if(new URLSearchParams(location.search).get('new')==='1')setCreating(true);},[]);
 const all=state.jobs||[];const name=(id:string)=>state.people.find(p=>p.id===id)?.name||'Unassigned';const client=(j:Job)=>state.contacts.find(c=>c.id===j.contactId)?.name||'';
 const jobs=all.filter(j=>!!j.archivedAt===archived&&(owner==='all'||j.owner===owner||j.crew.includes(owner))&&(stageFilter==='all'||j.stage===stageFilter)&&[j.name,j.number,client(j),j.address].join(' ').toLowerCase().includes(q.toLowerCase()));
 const active=jobs.filter(j=>!closedStage(j.stage)&&j.stage!=='on_hold'),soon=offsetDate(today(),14),month=today().slice(0,7);
 function card(j:Job){return <article className="ops-deal-card" key={j.id} draggable={actor.role!=='viewer'&&!archived} onDragStart={e=>e.dataTransfer.setData('text/lfx-job',j.id)}><button className="ops-card-title" onClick={()=>router.push(`/admin/jobs/${j.id}`)}>{j.name}</button><p>{j.number} · {client(j)}</p><div className="ops-card-value"><b>{money(j.value)}</b><span>{j.startDate?`Starts ${dateLabel(j.startDate)}`:'No start date'}</span></div><div className="ops-card-meta"><span><UserRound size={12}/>{name(j.owner)}</span><span><Clock3 size={12}/>{jobDays(j)}d in stage</span>{!!j.crew.length&&<span><Users size={12}/>{j.crew.length} crew</span>}</div>{jobNeedsNext(j)&&<small className="ops-warning">Next step needed</small>}{j.stage==='on_hold'&&<small className="ops-warning">On hold · {j.holdReason}</small>}<div className="ops-card-footer"><Link href={`/admin/jobs/${j.id}?tab=logs`}>Daily logs</Link><button disabled={archived||actor.role==='viewer'} onClick={()=>setMove({job:j,stage:j.stage})}>Move</button></div></article>;}
 return <><PageTitle title="Jobs" description="Every install. A clear next step.">{actor.role==='admin'&&<Button asChild variant="outline"><Link href="/admin/jobs/stages"><Settings2 size={16}/>Stage settings</Link></Button>}<Button asChild variant="outline"><Link href="/admin/jobs/logs"><NotebookPen size={16}/>Daily Logs</Link></Button><Button disabled={actor.role==='viewer'} onClick={()=>setCreating(true)}><Plus size={16}/>New job</Button></PageTitle>
  <div className="ops-stats"><div><span>Active jobs</span><b>{active.length}</b><small>Excludes on hold</small></div><div><span>Active value</span><b>{money(active.reduce((v,j)=>v+j.value,0))}</b><small>Current filters</small></div><div><span>Starting in 14 days</span><b>{jobs.filter(j=>j.startDate&&j.startDate>=today()&&j.startDate<=soon).length}</b><small>By start date</small></div><div><span>Completed this month</span><b>{jobs.filter(j=>j.stage==='complete'&&j.completedAt?.slice(0,7)===month).length}</b><small>{jobs.filter(j=>j.stage==='on_hold').length} on hold</small></div></div>
  <Handoffs/>
  <div className="ops-toolbar ops-pipeline-filters"><SearchBox value={q} onChange={setQ} placeholder="Search jobs…"/><BrandedSelect aria-label="Filter owner or crew" value={owner} onChange={e=>setOwner(e.target.value)}><option value="all">All team members</option>{state.people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</BrandedSelect><BrandedSelect aria-label="Filter stage" value={stageFilter} onChange={e=>setStageFilter(e.target.value)}><option value="all">All stages</option>{JOB_STAGES.map(s=><option key={s} value={s}>{jobLabel(state,s)}</option>)}</BrandedSelect><label className="ops-inline"><BrandedInput type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)}/>Archived</label><DownloadButton name="layeredfx-jobs.json" data={jobs}/></div>
  <div className="ops-toolbar"><p className="ops-muted">{jobs.length} job{jobs.length===1?"":"s"} · Drag a card or use its Move button.</p><Views values={['board','list','table','cards','calendar']} value={view} onChange={setView}/></div>
  {view==='board'?<div className="ops-board" aria-label="Jobs board">{JOB_STAGES.map(s=><section key={s} className="ops-lane" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const j=jobs.find(x=>x.id===e.dataTransfer.getData('text/lfx-job'));if(j)setMove({job:j,stage:s});}}><header><JobStageBadge stage={s}/><span>{jobs.filter(j=>j.stage===s).length}</span></header><p className="ops-lane-total">{money(jobs.filter(j=>j.stage===s).reduce((v,j)=>v+j.value,0))}</p>{jobs.filter(j=>j.stage===s).map(card)}{!jobs.some(j=>j.stage===s)&&<div className="ops-drop">No jobs</div>}</section>)}</div>
  :view==='calendar'?<Calendar records={jobs.map(j=>({id:j.id,title:j.name,date:j.startDate,onClick:()=>router.push(`/admin/jobs/${j.id}`)}))}/>
  :view==='cards'?<div className="ops-card-grid">{jobs.map(card)}</div>
  :<div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Job</th><th>Stage</th><th>Value</th><th>Owner</th>{view==='table'&&<><th>Start</th><th>Target</th><th>Next step</th></>}<th>Action</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id}><td><Link href={`/admin/jobs/${j.id}`}><b>{j.name}</b></Link><small>{j.number} · {client(j)}</small></td><td><JobStageBadge stage={j.stage}/></td><td>{money(j.value)}</td><td>{name(j.owner)}</td>{view==='table'&&<><td>{dateLabel(j.startDate)}</td><td>{dateLabel(j.targetDate)}</td><td>{j.nextStep?.action||'Not set'}</td></>}<td><button disabled={archived||actor.role==='viewer'} onClick={()=>setMove({job:j,stage:j.stage})}>Move</button></td></tr>)}</tbody></table>{!jobs.length&&<Empty>{all.length?'No matching jobs.':'No jobs yet. Win an opportunity or create a job to start.'}</Empty>}</div>}
  {creating&&<JobForm onClose={()=>setCreating(false)}/>}
  {move&&<JobMoveDialog key={`${move.job.id}:${move.stage}`} job={move.job} target={move.stage} onClose={()=>setMove(null)}/>}
 </>;
}

export function JobDetail({id}:{id:string}){
 const {state,actor,dispatch}=useOperations();const router=useRouter();const j=(state.jobs||[]).find(x=>x.id===id);const [move,setMove]=useState<JobStage|null>(null);const [edit,setEdit]=useState(false);const [tab,setTab]=useState('logs');const [modal,setModal]=useState<''|'next'|'step'|'archive'>('');
 useEffect(()=>{const t=new URLSearchParams(location.search).get('tab');if(t==='activity'||t==='history')setTab(t);},[]);
 if(!j)return <Empty>Job not found. <Link href="/admin/jobs">Return to jobs</Link></Empty>;
 const g=jobGuide(state,j);const steps=jobSteps(state,j);const contact=state.contacts.find(c=>c.id===j.contactId);const deal=j.opportunityId?state.deals.find(d=>d.id===j.opportunityId):undefined;const editable=actor.role!=='viewer'&&!j.archivedAt;const person=(pid:string)=>state.people.find(p=>p.id===pid)?.name||pid;
 const tabs=<Views values={['logs','activity','history']} value={tab} onChange={setTab}/>;
 const runForm=async(e:React.FormEvent<HTMLFormElement>,type:string)=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget).entries());if(await dispatch({type,id,...f,required:f.required==='on'}))setModal('');};
 const activities=(state.jobActivities||[]).filter(a=>a.jobId===id).slice().reverse();
 const pathIndex=JOB_PATH.indexOf(j.stage);
 return <><Link className="ops-back" href="/admin/jobs"><ArrowLeft size={15}/>Jobs</Link>
  <div className="ops-record-header"><PageTitle eyebrow={`LAYEREDFX / JOB ${j.number}`} title={j.name} description={`${contact?.name||'No client'}${j.address?` · ${j.address}`:''}`}><JobStageBadge stage={j.stage}/><Button variant="outline" disabled={!editable} onClick={()=>setEdit(true)}>Edit details</Button></PageTitle></div>
  <div className="ops-stage-path">{JOB_PATH.map((s,i)=><button key={s} disabled={!editable} className={`${s===j.stage?'current':''} ${pathIndex>=0&&i<pathIndex?'complete':''}`} onClick={()=>setMove(s)}><span>{pathIndex>=0&&i<pathIndex?<CheckCircle2 size={14}/>:i+1}</span>{jobLabel(state,s)}</button>)}</div>
  {j.archivedAt&&<p className="ops-info">This job is archived. Its history and daily logs are retained. <button onClick={()=>void dispatch({type:'job.archive',id,restore:true})}>Restore</button></p>}
  {j.stage==='on_hold'&&<p className="ops-warning">On hold: {j.holdReason}</p>}
  {j.stage==='cancelled'&&<p className="ops-warning">Cancelled: {j.cancelReason}</p>}
  <div className="ops-detail-grid"><div>
   <Panel title="Job overview" action={<b>{money(j.value)}</b>}><dl className="ops-key-values"><dt>Owner</dt><dd>{person(j.owner)}</dd><dt>Client</dt><dd>{contact?.name}<small>{contact?.email}</small><small>{contact?.phone}</small></dd><dt>Site</dt><dd>{j.address?<a href={`https://maps.google.com/?q=${encodeURIComponent(j.address)}`} target="_blank" rel="noreferrer"><MapPin size={13}/>{j.address}</a>:'Not set'}</dd><dt>Crew</dt><dd>{j.crew.map(person).join(', ')||'Not assigned'}</dd><dt>Start</dt><dd>{dateLabel(j.startDate)}</dd><dt>Target</dt><dd>{dateLabel(j.targetDate)}</dd><dt>Time in stage</dt><dd>{jobDays(j)} days</dd><dt>Services</dt><dd>{j.services.join(', ')||'Not selected'}</dd>{deal&&<><dt>Opportunity</dt><dd><Link href={`/admin/pipeline/${deal.id}`}>{deal.name}</Link></dd></>}</dl>{j.notes&&<p className="ops-prewrap">{j.notes}</p>}
    <div className="ops-actions"><Button size="sm" variant="outline" disabled={!editable} onClick={()=>setMove('on_hold')}>Put on hold</Button><Button size="sm" variant="outline" disabled={!editable} onClick={()=>setMove('cancelled')}>Cancel job</Button><Button size="sm" variant="outline" disabled={!editable} onClick={()=>setModal('archive')}>Archive</Button></div></Panel>
   <Panel title="Next action" action={<button disabled={!editable} onClick={()=>setModal('next')}>Edit</button>}>{j.nextStep?<><b>{j.nextStep.action}</b><p>{dateLabel(j.nextStep.dueDate)} · {person(j.nextStep.assignee)}</p></>:<p className="ops-warning">No next action scheduled.</p>}{jobNeedsNext(j)&&j.nextStep&&<p className="ops-warning">The next action is overdue.</p>}{j.nextStep&&<button disabled={!editable} onClick={()=>void dispatch({type:'job.next',id,clear:true})}>Clear</button>}</Panel>
   <Panel title={g.label}><h3>{g.goal}</h3><div className="ops-guidance">{g.actions.map((a,i)=><p key={i}><ArrowRight size={14}/>{a}</p>)}</div><div className="ops-progress"><span style={{width:`${steps.length?steps.filter(s=>s.done).length/steps.length*100:0}%`}}/></div><p className="ops-muted">{steps.filter(s=>s.done).length} of {steps.length} stage steps complete</p>
    <div className="ops-checklist">{steps.map(i=><label key={i.id}><BrandedInput type="checkbox" checked={i.done} disabled={!editable||(i.automatic&&!i.done&&!i.autoDone)} onChange={e=>void dispatch({type:'job.check',id,stage:j.stage,itemId:i.id,done:e.target.checked})}/><span>{i.label}{i.required&&<b className="ops-required">Required</b>}{i.automatic&&<small>{i.overridden?'Unchecked manually · check again to use the job fields':i.autoDone?'Verified from job fields':'Complete the related job field to check this step'}</small>}</span>{!i.automatic&&j.extraItems.some(x=>x.id===i.id)&&editable&&<button type="button" aria-label={`Remove ${i.label}`} onClick={e=>{e.preventDefault();void dispatch({type:'job.extra',id,stage:j.stage,removeId:i.id});}}>×</button>}</label>)}</div>
    <Button size="sm" variant="outline" disabled={!editable} onClick={()=>setModal('step')}><Plus size={14}/>Add job-specific step</Button></Panel>
  </div><div>
   {tab==='logs'?<Panel title="Daily Logs" tabs={tabs}><JobDailyLogs jobId={id}/></Panel>
   :tab==='activity'?<Panel title="Activity" tabs={tabs}><div className="ops-timeline">{activities.map(a=><article key={a.id}><span className="ops-badge">{a.kind.replaceAll('_',' ')}</span><p className="ops-prewrap">{a.body}</p><small>{a.actor} · {dateLabel(a.occurredAt)}</small></article>)}{!activities.length&&<Empty>No activity yet.</Empty>}</div></Panel>
   :<Panel title="Stage history" tabs={tabs}>{j.stageHistory.slice().reverse().map((h,i)=><div className="ops-history" key={i}><b>{JOB_LABELS[h.stage]}</b><span>{dateLabel(h.at)} · {person(h.by)}</span>{h.note&&<p>{h.note}</p>}{h.overrideReason&&<p className="ops-warning">Override: {h.overrideReason}</p>}</div>)}</Panel>}
  </div></div>
  {move&&<JobMoveDialog key={move} job={j} target={move} onClose={()=>setMove(null)}/>}
  {edit&&<JobForm job={j} onClose={()=>setEdit(false)}/>}
  {modal&&<Modal open onClose={()=>setModal('')} title={{next:'Schedule next action',step:'Add stage step',archive:'Archive job'}[modal]}>
   {modal==='next'&&<form onSubmit={e=>void runForm(e,'job.next')}><Field label="Action"><BrandedInput name="action" required defaultValue={j.nextStep?.action}/></Field><div className="ops-form-grid"><Field label="Due date"><BrandedInput name="dueDate" type="date" required defaultValue={j.nextStep?.dueDate}/></Field><Field label="Assignee"><BrandedSelect name="assignee" defaultValue={j.nextStep?.assignee||j.owner}>{state.people.filter(p=>p.role!=='viewer').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</BrandedSelect></Field></div><Button type="submit">Save next action</Button></form>}
   {modal==='step'&&<form onSubmit={e=>void runForm(e,'job.extra')}><input type="hidden" name="stage" value={j.stage}/><Field label="Step"><BrandedInput name="label" required/></Field><label className="ops-inline"><BrandedInput name="required" type="checkbox"/>Required before advancing</label><Button type="submit">Add step</Button></form>}
   {modal==='archive'&&<><p>The job will be hidden from the active board. Its stage history and daily logs remain.</p><Button onClick={async()=>{if(await dispatch({type:'job.archive',id})){setModal('');router.push('/admin/jobs');}}}>Archive job</Button></>}
  </Modal>}
 </>;
}

export function JobStageSettings(){
 const {state,actor,dispatch}=useOperations();const [stage,setStage]=useState<JobStage>('handoff');const [draft,setDraft]=useState<JobStageGuide>(()=>structuredClone(state.jobStageConfig?.handoff||DEFAULT_JOB_STAGES.handoff));
 if(actor.role!=='admin')return <Empty>Job stage settings are administrator-only.</Empty>;
 return <><Link className="ops-back" href="/admin/jobs"><ArrowLeft size={15}/>Jobs</Link><PageTitle title="Job stage settings" description="Customize guidance and completion requirements without changing stable stage IDs."/><div className="ops-detail-grid"><div className="ops-stage-settings-nav">{JOB_STAGES.map(s=><button key={s} className={stage===s?'active':''} onClick={()=>{setStage(s);setDraft(structuredClone(state.jobStageConfig?.[s]||DEFAULT_JOB_STAGES[s]));}}>{jobLabel(state,s)}</button>)}</div>
  <Panel title={JOB_LABELS[stage]}><form onSubmit={async e=>{e.preventDefault();await dispatch({type:'jobstage.configure',stage,config:draft});}}>
   <Field label="Display name"><BrandedInput required value={draft.label} onChange={e=>setDraft({...draft,label:e.target.value})}/></Field>
   <Field label="Stage goal"><textarea required value={draft.goal} onChange={e=>setDraft({...draft,goal:e.target.value})}/></Field>
   <Field label="Suggested actions (one per line)"><textarea rows={4} value={draft.actions.join('\n')} onChange={e=>setDraft({...draft,actions:e.target.value.split('\n')})}/></Field>
   <h3>Checklist</h3>{draft.items.map((item,i)=><div className="ops-check-setting" key={item.id}><BrandedInput aria-label={`Checklist label ${i+1}`} required value={item.label} onChange={e=>setDraft({...draft,items:draft.items.map((x,k)=>i===k?{...x,label:e.target.value}:x)})}/><label><BrandedInput type="checkbox" checked={item.required} onChange={e=>setDraft({...draft,items:draft.items.map((x,k)=>i===k?{...x,required:e.target.checked}:x)})}/>Required</label><span>{item.auto?'Automatic':'Manual'}</span><button type="button" aria-label={`Remove ${item.label}`} onClick={()=>setDraft({...draft,items:draft.items.filter((_,k)=>i!==k)})}>×</button></div>)}
   <div className="ops-actions"><Button variant="outline" onClick={()=>setDraft({...draft,items:[...draft.items,{id:uid('item'),label:'New step',required:false,auto:null}]})}>Add step</Button><Button type="submit">Save stage settings</Button><Button variant="outline" onClick={async()=>{if(await dispatch({type:'jobstage.configure',stage,reset:true}))setDraft(structuredClone(DEFAULT_JOB_STAGES[stage]));}}>Reset this stage</Button></div>
   <p className="ops-muted">Completed checklist IDs stay stable. Removing a requirement changes future moves; it does not rewrite job history.</p>
  </form></Panel></div></>;
}
