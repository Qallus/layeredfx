"use client";
// Dashboard overview modeled on the CMI overview: pipeline and tasks first, then section stats,
// recent activity, quick actions and upcoming appointments.
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {AlertTriangle,ArrowRight,BriefcaseBusiness,CalendarRange,CheckSquare,ClipboardList,Clock,FileText,FolderKanban,Newspaper,Plus,Target,TrendingUp,UserPlus,Users} from 'lucide-react';
import {useOperations} from './provider';
import {DownloadButton,PageTitle,dateLabel,money} from './shared';
import {DEFAULT_STAGES,OPEN,needsNextStep,stats,today} from '@/lib/operations/engine.mjs';

type Upcoming={id:string;title:string;customer:string;start_time:string;status:string};
type BookingSummary={upcoming:number;pending:number;next:Upcoming[]};
type Activity={key:string;type:'Contact'|'Lead'|'Opportunity'|'Update'|'Document';label:string;sub:string;at:string;href:string};

const QUICK_ACTIONS=[
 {label:'New Contact',href:'/admin/contacts',icon:UserPlus},
 {label:'New Opportunity',href:'/admin/pipeline',icon:TrendingUp},
 {label:'New Booking',href:'/admin/bookings',icon:CalendarRange},
 {label:'New Plan',href:'/admin/plans',icon:ClipboardList},
 {label:'New Document',href:'/admin/workspace',icon:FileText},
 {label:'New Blog Post',href:'/admin/blog',icon:Newspaper},
];
const TASK_LABELS:Record<string,string>={not_started:'Not started',in_progress:'In progress',waiting:'Waiting',blocked:'Blocked',complete:'Complete'};

function relative(iso:string){const diff=Date.now()-new Date(iso).getTime();if(!Number.isFinite(diff))return '';const mins=Math.floor(diff/60000);if(mins<1)return 'just now';if(mins<60)return `${mins}m ago`;const hrs=Math.floor(mins/60);if(hrs<24)return `${hrs}h ago`;return `${Math.floor(hrs/24)}d ago`;}
const appointmentTime=(iso:string)=>new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Phoenix'}).format(new Date(iso));
const plusDays=(date:string,days:number)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};

function useBookingSummary(){
 const [summary,setSummary]=useState<BookingSummary|null>(null);const [failed,setFailed]=useState(false);
 useEffect(()=>{let current=true;fetch('/api/ctrlp/admin/bookings?summary=1',{cache:'no-store'}).then(res=>res.ok?res.json():Promise.reject(new Error('unavailable'))).then(data=>{if(current)setSummary({upcoming:Number(data.upcoming)||0,pending:Number(data.pending)||0,next:Array.isArray(data.next)?data.next:[]});}).catch(()=>{if(current)setFailed(true);});return()=>{current=false;};},[]);
 return {summary,failed};
}

export function OperationsOverview(){
 const {state,mode}=useOperations();const {summary,failed}=useBookingSummary();
 const deals=state.deals.filter(d=>!d.archivedAt);const pipeline=stats(state.deals);const needsStep=deals.filter(d=>needsNextStep(d)).length;
 const stageLabel=(stage:string)=>state.stageConfig?.[stage as keyof typeof state.stageConfig]?.label||DEFAULT_STAGES[stage as keyof typeof DEFAULT_STAGES]?.label||stage;
 const byStage=OPEN.map((stage:string)=>{const items=deals.filter(d=>d.stage===stage);return {stage,count:items.length,value:items.reduce((v,d)=>v+d.value,0)};});
 const widest=Math.max(1,...byStage.map(s=>s.count));
 const activePlans=new Set(state.plans.filter(p=>!p.archived_at).map(p=>p.id));
 const openTasks=state.tasks.filter(t=>activePlans.has(t.plan_id)&&t.status!=='complete');
 const day=today(),week=plusDays(day,7);
 const overdue=openTasks.filter(t=>t.due_date&&t.due_date<day).length,dueWeek=openTasks.filter(t=>t.due_date&&t.due_date>=day&&t.due_date<=week).length,blocked=openTasks.filter(t=>t.status==='blocked').length;
 const nextTasks=openTasks.slice().sort((a,b)=>(a.due_date||'9999').localeCompare(b.due_date||'9999')).slice(0,5);
 const planName=(id:string)=>state.plans.find(p=>p.id===id)?.name||'Plan';

 const cards=[
  {label:'Contacts',value:state.contacts.length,icon:Users,href:'/admin/contacts'},
  {label:'Leads',value:state.leads.length,icon:Target,href:'/admin/leads'},
  {label:'Open opportunities',value:pipeline.openCount,icon:BriefcaseBusiness,href:'/admin/pipeline'},
  {label:'Projects',value:(state.projects||[]).length,icon:FolderKanban,href:'/admin/production-schedule'},
  {label:'Upcoming bookings',value:summary?summary.upcoming:failed?'—':'…',icon:CalendarRange,href:'/admin/bookings'},
  {label:'Documents',value:state.documents.filter(d=>!d.archived_at).length,icon:FileText,href:'/admin/workspace'},
  {label:'Active plans',value:activePlans.size,icon:ClipboardList,href:'/admin/plans'},
  {label:'Team members',value:state.people.length,icon:Users,href:'/admin/users'},
 ];

 const activity:Activity[]=[
  ...state.contacts.map(c=>({key:`c-${c.id}`,type:'Contact' as const,label:c.name,sub:c.email||c.company||c.phone||'',at:c.createdAt||'',href:'/admin/contacts'})),
  ...state.leads.map(l=>({key:`l-${l.id}`,type:'Lead' as const,label:l.name,sub:[l.company,l.source].filter(Boolean).join(' · '),at:l.createdAt,href:'/admin/leads'})),
  ...state.deals.map(d=>({key:`d-${d.id}`,type:'Opportunity' as const,label:d.name,sub:`${d.client} · ${money(d.value)}`,at:d.createdAt,href:`/admin/pipeline/${d.id}`})),
  ...state.activities.map(a=>({key:`a-${a.id}`,type:'Update' as const,label:state.deals.find(d=>d.id===a.dealId)?.name||'Opportunity',sub:`${a.actor} · ${a.body}`,at:a.occurredAt,href:`/admin/pipeline/${a.dealId}`})),
  ...state.documents.filter(d=>!d.archived_at).map(d=>({key:`w-${d.id}`,type:'Document' as const,label:d.title,sub:d.owner_name||'',at:d.updated_at||d.created_at,href:`/admin/workspace/${d.id}`})),
 ].filter(item=>item.at&&item.label).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,8);

 return <div className="ops-overview">
  <PageTitle eyebrow="DASHBOARD" title="Overview" description="A snapshot of your business across every section."><DownloadButton name="layeredfx-operations-export.json" data={{exportedAt:new Date().toISOString(),mode,state}} label="Export visible data"/></PageTitle>

  <div className="ops-focus-grid">
   <section className="ops-focus-card" aria-labelledby="overview-pipeline">
    <header><span className="ops-focus-icon"><TrendingUp size={17}/></span><h2 id="overview-pipeline">Pipeline</h2><Link href="/admin/pipeline">Open pipeline <ArrowRight size={13}/></Link></header>
    <div className="ops-focus-metrics">
     <div><span>Open value</span><b>{money(pipeline.openValue)}</b><small>{pipeline.openCount} open</small></div>
     <div><span>Weighted forecast</span><b>{money(pipeline.weighted)}</b><small>Value × probability</small></div>
     <div><span>Win rate</span><b>{pipeline.winRate}%</b><small>{money(pipeline.wonValue)} won</small></div>
    </div>
    <ul className="ops-stage-bars">{byStage.map(s=><li key={s.stage}><Link href="/admin/pipeline"><span>{stageLabel(s.stage)}</span><i aria-hidden><em style={{width:`${s.count/widest*100}%`}}/></i><b>{s.count}</b><small>{money(s.value)}</small></Link></li>)}</ul>
    <footer>{needsStep?<Link className="is-alert" href="/admin/pipeline"><AlertTriangle size={14}/>{needsStep} {needsStep===1?'opportunity needs':'opportunities need'} a next step</Link>:<span>Every open opportunity has a next step.</span>}<Link href="/admin/leads">Lead inbox <ArrowRight size={13}/></Link></footer>
   </section>

   <section className="ops-focus-card" aria-labelledby="overview-tasks">
    <header><span className="ops-focus-icon"><CheckSquare size={17}/></span><h2 id="overview-tasks">Tasks</h2><Link href="/admin/plans">View plans <ArrowRight size={13}/></Link></header>
    <div className="ops-focus-metrics is-four">
     <div><span>Open</span><b>{openTasks.length}</b></div>
     <div className={overdue?'is-danger':''}><span>Overdue</span><b>{overdue}</b></div>
     <div><span>Due in 7 days</span><b>{dueWeek}</b></div>
     <div className={blocked?'is-warning':''}><span>Blocked</span><b>{blocked}</b></div>
    </div>
    <ul className="ops-task-list">{nextTasks.map(t=><li key={t.id}><Link href={`/admin/plans/${t.plan_id}`}><div><b>{t.title}</b><small>{planName(t.plan_id)} · {TASK_LABELS[t.status]||t.status}</small></div><span className={t.due_date&&t.due_date<day?'is-overdue':''}>{t.due_date?dateLabel(t.due_date):'No due date'}</span></Link></li>)}</ul>
    {!nextTasks.length&&<p className="ops-overview-empty">No open tasks. Create a plan to schedule installation work.</p>}
   </section>
  </div>

  <div className="ops-stat-grid">{cards.map(card=>{const Icon=card.icon;return <Link key={card.label} href={card.href} className="ops-stat-card"><div><span>{card.label}</span><b>{card.value}</b></div><i aria-hidden><Icon size={16}/></i></Link>;})}</div>

  <div className="ops-overview-columns">
   <section className="ops-overview-panel" aria-labelledby="overview-activity">
    <header><h2 id="overview-activity">Recent activity</h2><Clock size={15} aria-hidden/></header>
    {activity.length?<ul className="ops-activity-list">{activity.map(item=><li key={item.key}><Link href={item.href}><div><span className={`ops-activity-badge is-${item.type.toLowerCase()}`}>{item.type}</span><b>{item.label}</b>{item.sub&&<small>{item.sub}</small>}</div><time dateTime={item.at}>{relative(item.at)}</time></Link></li>)}</ul>:<p className="ops-overview-empty">No recent activity yet.</p>}
   </section>
   <div className="ops-overview-side">
    <section className="ops-overview-panel" aria-labelledby="overview-quick">
     <header><h2 id="overview-quick">Quick actions</h2></header>
     <div className="ops-quick-grid">{QUICK_ACTIONS.map(action=><Link key={action.label} href={action.href}><Plus size={13} aria-hidden/>{action.label}</Link>)}</div>
    </section>
    <section className="ops-overview-panel" aria-labelledby="overview-upcoming">
     <header><h2 id="overview-upcoming">Upcoming</h2><Link href="/admin/bookings">View all <ArrowRight size={13}/></Link></header>
     {failed?<p className="ops-overview-empty" role="alert">Bookings could not be loaded.</p>:!summary?<p className="ops-overview-empty">Loading appointments…</p>:summary.next.length?<ul className="ops-upcoming-list">{summary.next.map(appt=><li key={appt.id}><i aria-hidden><CalendarRange size={13}/></i><div><b>{appt.title}</b><small>{appt.customer}</small><small>{appointmentTime(appt.start_time)}{appt.status==='pending'?' · Pending':''}</small></div></li>)}</ul>:<p className="ops-overview-empty">No upcoming appointments.</p>}
    </section>
   </div>
  </div>
 </div>;
}
