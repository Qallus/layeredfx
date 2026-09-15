"use client";
// Quick Tools, adapted from Channel Cast's opportunity record tools: one button per tool, each opening a modal.
// Horizontal (swipeable on small screens) while the sidebar is open; a sticky vertical column beside the
// collapsed sidebar. The layout switch is pure CSS keyed off .ops-sidebar-collapsed (dashboard.css).
import {useEffect,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Bot,CalendarClock,ClipboardList,CreditCard,FileSignature,FileText,Mail,MessageSquare,Mic,Phone,Receipt,StickyNote,UserPlus,type LucideIcon} from 'lucide-react';
import {PLAN_TEMPLATES} from '@/lib/operations/defaults.mjs';
import type {Deal} from '@/lib/operations/types';
import {BrandedInput,BrandedSelect} from './branded-fields';
import {useOperations} from './provider';
import {Button,Field,Modal} from './shared';
import {Dialpad,QuickNotes,SmsTool,request,unavailable,type Capabilities} from './quick-actions';
import {VoiceRecorder} from './voice-recorder';

type ToolId='call'|'sms'|'email'|'schedule'|'note'|'voice'|'agent'|'plan'|'contact'|'quote'|'sow'|'invoice'|'billing';
type ContactRecord=ReturnType<typeof useOperations>['state']['contacts'][number];
const TOOLS:{id:ToolId;label:string;icon:LucideIcon;title:string}[]=[
 {id:'call',label:'Call',icon:Phone,title:'Call'},
 {id:'sms',label:'SMS',icon:MessageSquare,title:'Send an SMS'},
 {id:'email',label:'Email',icon:Mail,title:'Send an email'},
 {id:'schedule',label:'Schedule',icon:CalendarClock,title:'Schedule'},
 {id:'note',label:'Note',icon:StickyNote,title:'Note'},
 {id:'voice',label:'Voice note',icon:Mic,title:'Voice recorder'},
 {id:'agent',label:'AI Agent',icon:Bot,title:'AI Agent'},
 {id:'plan',label:'Plan',icon:ClipboardList,title:'Plan'},
 {id:'contact',label:'Contact',icon:UserPlus,title:'Contact'},
 {id:'quote',label:'Quote',icon:FileText,title:'Draft a quote'},
 {id:'sow',label:'SOW',icon:FileSignature,title:'Draft a statement of work'},
 {id:'invoice',label:'Invoice',icon:Receipt,title:'Draft an invoice'},
 {id:'billing',label:'Billing',icon:CreditCard,title:'Billing'},
];
const DRAFTS={quote:{templateId:'quote',name:'Quote'},sow:{templateId:'sow',name:'Statement of work'},invoice:{templateId:'invoice',name:'Invoice draft'}} as const;
const EMAIL=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
/** Twilio needs E.164; US numbers saved without a country code are assumed to be +1. */
function e164(value?:string){const raw=(value||'').replace(/[^\d+]/g,'');if(/^\+[1-9]\d{7,14}$/.test(raw))return raw;const digits=raw.replace(/\D/g,'');if(digits.length===10)return `+1${digits}`;if(digits.length===11&&digits.startsWith('1'))return `+${digits}`;return '';}

/** Page wrapper that places the Quick Tools above (or beside, when the sidebar is collapsed) the page content. */
export function QuickToolsLayout({deal,children}:{deal?:Deal;children:ReactNode}){
 return <div className="ops-qt-layout"><QuickToolbar deal={deal}/><div className="ops-qt-content">{children}</div></div>;
}

export function QuickToolbar({deal}:{deal?:Deal}){
 const {mode,actor}=useOperations();const [tool,setTool]=useState<ToolId|null>(null);const [caps,setCaps]=useState<Capabilities>(unavailable);
 useEffect(()=>{if(mode==='supabase'&&(tool==='call'||tool==='sms'||tool==='email'))void request('capabilities').then(setCaps).catch(()=>setCaps(unavailable));},[mode,tool]);
 const active=TOOLS.find(t=>t.id===tool);
 return <nav className="ops-quicktools" aria-label="Quick tools">
  <div className="ops-quicktools-track">{TOOLS.map(t=>{const Icon=t.icon;return <button key={t.id} type="button" onClick={()=>setTool(t.id)}><Icon size={15} aria-hidden/>{t.label}</button>;})}</div>
  {active&&<Modal open title={active.title} description={deal?`For ${deal.name}.`:'Opens without a linked opportunity.'} onClose={()=>setTool(null)}>
   <ToolBody tool={active.id} deal={deal} caps={caps} readOnly={actor.role==='viewer'||Boolean(deal?.archivedAt)} onDone={()=>setTool(null)}/>
  </Modal>}
 </nav>;
}

function ToolBody({tool,deal,caps,readOnly,onDone}:{tool:ToolId;deal?:Deal;caps:Capabilities;readOnly:boolean;onDone:()=>void}){
 const {state}=useOperations();const contact=deal?state.contacts.find(c=>c.id===deal.contactId):undefined;const phone=e164(contact?.phone);
 switch(tool){
  case 'call':return <>{<Dialpad caps={caps} seed={{phone}}/>}{deal&&<LogToDeal deal={deal} kind="call" label="Log this call" readOnly={readOnly}/>}</>;
  case 'sms':return <>{<SmsTool caps={caps} seed={{phone}}/>}{deal&&<LogToDeal deal={deal} kind="sms" label="Log a text sent elsewhere" readOnly={readOnly}/>}</>;
  case 'email':return <EmailTool deal={deal} contact={contact} caps={caps} readOnly={readOnly}/>;
  case 'schedule':return <ScheduleTool deal={deal} readOnly={readOnly} onDone={onDone}/>;
  case 'note':return deal?<LogToDeal deal={deal} kind="note" label="Note" readOnly={readOnly} primary onDone={onDone}/>:<QuickNotes/>;
  case 'voice':return <><VoiceRecorder/>{deal&&<LogToDeal deal={deal} kind="voice" label="Summarize the voice note on the timeline" readOnly={readOnly}/>}</>;
  case 'agent':return <div className="ops-quick-tool"><p>Set up Eve, Paperclip teams and the voice agent, and queue work for them.</p><p className="ops-muted">Agents don’t run from the dashboard yet; the Hermes, Paperclip and xAI connections still need to be built.</p><div className="ops-actions"><Button asChild><Link href="/admin/agent">Open AI Agents</Link></Button></div></div>;
  case 'plan':return <PlanTool deal={deal} readOnly={readOnly}/>;
  case 'contact':return <ContactTool contact={contact} readOnly={readOnly} onDone={onDone}/>;
  case 'quote':case 'sow':case 'invoice':return <DraftTool kind={tool} deal={deal} readOnly={readOnly}/>;
  case 'billing':return <div className="ops-quick-tool"><p>Online billing isn’t connected yet, so no card is charged and no payment is collected here.</p><div className="ops-actions"><Button asChild variant="outline"><Link href="/admin/payments">Open payments</Link></Button></div>{deal&&<LogToDeal deal={deal} kind="payment" label="Log a payment received elsewhere" readOnly={readOnly}/>}</div>;
 }
}

/** Records what happened on the opportunity timeline. Logging never places a call or sends a message. */
function LogToDeal({deal,kind,label,readOnly,primary=false,onDone}:{deal:Deal;kind:string;label:string;readOnly:boolean;primary?:boolean;onDone?:()=>void}){
 const {dispatch,busy}=useOperations();const [body,setBody]=useState('');const [saved,setSaved]=useState(false);
 return <form className={primary?'ops-quick-tool':'ops-quick-log'} onSubmit={async e=>{e.preventDefault();if(await dispatch({type:'deal.activity',id:deal.id,kind,body})){setBody('');setSaved(true);onDone?.();}}}>
  <Field label={label}><textarea required rows={primary?6:3} maxLength={5000} value={body} onChange={e=>{setBody(e.target.value);setSaved(false);}}/></Field>
  <div className="ops-actions"><Button type="submit" size="sm" disabled={busy||readOnly||!body.trim()}>Save to timeline</Button>{saved&&<span role="status" className="ops-muted">Saved to the activity timeline.</span>}</div>
 </form>;
}

function EmailTool({deal,contact,caps,readOnly}:{deal?:Deal;contact?:ContactRecord;caps:Capabilities;readOnly:boolean}){
 const {dispatch,mode}=useOperations();const [to,setTo]=useState(contact?.email||'');const [subject,setSubject]=useState(deal?.name||'');const [body,setBody]=useState('');const [status,setStatus]=useState('');const [sending,setSending]=useState(false);
 // Reused on retry so a timed-out send cannot be delivered twice; replaced after a confirmed send.
 const [requestId,setRequestId]=useState(()=>crypto.randomUUID());
 const canSend=mode==='supabase'&&caps.email&&caps.canSend&&!readOnly;
 async function send(){setSending(true);setStatus('');try{const result=await request('email',{to,subject,body,requestId});setStatus(result.message);if(deal)await dispatch({type:'deal.activity',id:deal.id,kind:'email',body:`Email to ${to} · ${subject}\n\n${body}`});setBody('');setRequestId(crypto.randomUUID());}catch(e){setStatus(e instanceof Error?e.message:'Email failed.');}finally{setSending(false);}}
 return <div className="ops-quick-tool">
  <p className="ops-muted">{canSend?'Sends from the LayeredFX email address.':mode==='demo'?'Local preview: email is not sent in this mode.':'Email sending is not connected for this account. You can open the message in your email app instead.'}</p>
  <Field label="To"><BrandedInput type="email" value={to} maxLength={254} onChange={e=>setTo(e.target.value)}/></Field>
  <Field label="Subject"><BrandedInput value={subject} maxLength={200} onChange={e=>setSubject(e.target.value)}/></Field>
  <Field label="Message"><textarea rows={7} maxLength={10000} value={body} onChange={e=>setBody(e.target.value)}/></Field>
  <div className="ops-actions">
   <Button disabled={!canSend||sending||!EMAIL.test(to)||!subject.trim()||!body.trim()} onClick={()=>void send()}>{sending?'Sending…':'Send email'}</Button>
   <Button asChild variant="outline"><a href={`mailto:${EMAIL.test(to)?to:''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>Open in email app</a></Button>
  </div>
  {status&&<p role="status">{status}</p>}
  {deal&&!canSend&&<LogToDeal deal={deal} kind="email" label="Log an email sent elsewhere" readOnly={readOnly}/>}
 </div>;
}

function ScheduleTool({deal,readOnly,onDone}:{deal?:Deal;readOnly:boolean;onDone:()=>void}){
 const {state,dispatch,busy}=useOperations();
 return <div className="ops-quick-tool">
  {deal?<form className="ops-quick-tool" onSubmit={async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget).entries());if(await dispatch({type:'deal.next',id:deal.id,action:f.action,dueDate:f.dueDate,dueTime:f.dueTime,assignee:f.assignee,stepType:'meeting',priority:f.priority}))onDone();}}>
   <p className="ops-muted">Sets this opportunity’s next step. It does not send a calendar invitation.</p>
   <Field label="Appointment"><BrandedInput name="action" required maxLength={200} defaultValue="Consultation appointment"/></Field>
   <div className="ops-form-grid">
    <Field label="Date"><BrandedInput name="dueDate" type="date" required/></Field>
    <Field label="Time"><BrandedInput name="dueTime" type="time" defaultValue="09:00"/></Field>
    <Field label="Assignee"><BrandedSelect name="assignee" defaultValue={deal.owner}>{state.people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</BrandedSelect></Field>
    <Field label="Priority"><BrandedSelect name="priority" defaultValue="normal"><option>low</option><option>normal</option><option>high</option></BrandedSelect></Field>
   </div>
   <div className="ops-actions"><Button type="submit" disabled={busy||readOnly}>Save next step</Button></div>
  </form>:<p className="ops-muted">Review and manage appointments on the bookings calendar.</p>}
  <div className="ops-actions"><Button asChild variant="outline"><Link href="/admin/bookings">Open bookings calendar</Link></Button><Button asChild variant="outline"><a href="/book" target="_blank" rel="noreferrer">Open public booking page</a></Button></div>
 </div>;
}

function PlanTool({deal,readOnly}:{deal?:Deal;readOnly:boolean}){
 const {dispatch,busy}=useOperations();const router=useRouter();const [name,setName]=useState(deal?.name||'');const [templateId,setTemplateId]=useState('surface');
 return <form className="ops-quick-tool" onSubmit={async e=>{e.preventDefault();const id=await dispatch({type:'plan.create',name,templateId,visibility:'team',...(deal?{opportunityId:deal.id,once:true}:{})});if(id)router.push(`/admin/plans/${id}`);}}>
  {deal&&<p className="ops-muted">Opens this opportunity’s plan if one already exists.</p>}
  <Field label="Plan name"><BrandedInput required maxLength={200} value={name} onChange={e=>setName(e.target.value)}/></Field>
  <Field label="Template"><BrandedSelect value={templateId} onChange={e=>setTemplateId(e.target.value)}>{PLAN_TEMPLATES.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</BrandedSelect></Field>
  <div className="ops-actions"><Button type="submit" disabled={busy||readOnly}>{deal?'Create / open plan':'Create plan'}</Button></div>
 </form>;
}

function ContactTool({contact,readOnly,onDone}:{contact?:ContactRecord;readOnly:boolean;onDone:()=>void}){
 const {dispatch,busy}=useOperations();const [draft,setDraft]=useState({name:'',email:'',phone:'',company:'',type:'prospect'});
 const set=(key:keyof typeof draft)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setDraft({...draft,[key]:e.target.value});
 return <div className="ops-quick-tool">
  {contact&&<div className="ops-quick-log"><b>{contact.name}</b><span className="ops-muted">{[contact.email,contact.phone,contact.company].filter(Boolean).join(' · ')||'No contact details yet'}</span><div className="ops-actions"><Button asChild size="sm" variant="outline"><Link href="/admin/contacts">Open contacts</Link></Button></div></div>}
  <form className="ops-quick-tool" onSubmit={async e=>{e.preventDefault();if(await dispatch({type:'contact.save',patch:draft}))onDone();}}>
   <div className="ops-form-grid">
    <Field label="Name"><BrandedInput required maxLength={200} value={draft.name} onChange={set('name')}/></Field>
    <Field label="Company"><BrandedInput maxLength={200} value={draft.company} onChange={set('company')}/></Field>
    <Field label="Email"><BrandedInput type="email" maxLength={254} value={draft.email} onChange={set('email')}/></Field>
    <Field label="Phone"><BrandedInput type="tel" maxLength={60} value={draft.phone} onChange={set('phone')}/></Field>
    <Field label="Category"><BrandedSelect value={draft.type} onChange={set('type')}><option value="prospect">Prospect</option><option value="lead">Lead</option><option value="client">Client</option><option value="contact">Contact</option></BrandedSelect></Field>
   </div>
   <div className="ops-actions"><Button type="submit" disabled={busy||readOnly}>{contact?'Add another contact':'Save contact'}</Button></div>
  </form>
 </div>;
}

function DraftTool({kind,deal,readOnly}:{kind:keyof typeof DRAFTS;deal?:Deal;readOnly:boolean}){
 const draft=DRAFTS[kind];const {dispatch,busy}=useOperations();const router=useRouter();const [title,setTitle]=useState(`${deal?`${deal.name} · `:''}${draft.name}`);
 return <form className="ops-quick-tool" onSubmit={async e=>{e.preventDefault();const id=await dispatch({type:'document.create',title,templateId:draft.templateId,scope:'shared',...(deal?{opportunityId:deal.id}:{})});if(id)router.push(`/admin/workspace/${id}`);}}>
  <p className="ops-muted">Creates a shared Workspace draft{deal?' linked to this opportunity':''}. Sending, e-signature and payment collection are not connected yet.</p>
  <Field label="Document title"><BrandedInput required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/></Field>
  <div className="ops-actions"><Button type="submit" disabled={busy||readOnly}>Create draft</Button></div>
 </form>;
}
