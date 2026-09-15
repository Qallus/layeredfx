"use client";
// Notification bell (adapted from Channel Cast). The feed is derived from records this member can already see:
// new leads, open opportunities that need a next step, direct messages sent to them, and upcoming or requested
// bookings. Read state is remembered per member in this browser. Nothing here sends email or push notifications.
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {AlertTriangle,Bell,CalendarClock,MessageCircle,UserPlus,type LucideIcon} from 'lucide-react';
import {needsNextStep} from '@/lib/operations/engine.mjs';
import {useOperations} from './provider';

type Item={id:string;kind:'lead'|'next'|'message'|'booking';title:string;subtitle:string;at:string;href:string};
type Upcoming={id:string;title:string;customer:string;start_time:string;status:string};
const ICON:Record<Item['kind'],LucideIcon>={lead:UserPlus,next:AlertTriangle,message:MessageCircle,booking:CalendarClock};
const MAX_SEEN=400;

function when(iso:string){
 const time=new Date(iso).getTime();if(!Number.isFinite(time))return '';
 if(time>Date.now())return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Phoenix'}).format(time);
 const minutes=Math.floor((Date.now()-time)/60000);if(minutes<1)return 'just now';if(minutes<60)return `${minutes}m ago`;
 const hours=Math.floor(minutes/60);if(hours<24)return `${hours}h ago`;const days=Math.floor(hours/24);
 return days<30?`${days}d ago`:new Date(iso).toLocaleDateString('en-US');
}

export function NotificationBell(){
 const {state,actor}=useOperations();
 const [open,setOpen]=useState(false);const [seen,setSeen]=useState<string[]>([]);const [fresh,setFresh]=useState<string[]>([]);const [bookings,setBookings]=useState<Upcoming[]>([]);
 const ref=useRef<HTMLDivElement>(null);const storageKey=`lfx:notifications:seen:${actor.id}`;
 useEffect(()=>{try{const saved:unknown=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))setSeen(saved.filter((x):x is string=>typeof x==='string'));}catch{}},[storageKey]);
 // Upcoming appointments come from the staff-only bookings summary; refreshed every minute.
 useEffect(()=>{let live=true;const load=()=>fetch('/api/ctrlp/admin/bookings?summary=1',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(live&&data&&Array.isArray(data.next))setBookings(data.next);}).catch(()=>{});void load();const timer=setInterval(load,60000);return()=>{live=false;clearInterval(timer);};},[]);
 useEffect(()=>{if(!open)return;const onDown=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false);};const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};document.addEventListener('mousedown',onDown);document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('mousedown',onDown);document.removeEventListener('keydown',onKey);};},[open]);

 const items=useMemo<Item[]>(()=>{
  const person=(id:string)=>state.people.find(p=>p.id===id)?.name||'A teammate';
  return [
   ...state.leads.filter(l=>l.status==='new'&&!l.opportunityId).map(l=>({id:`lead:${l.id}`,kind:'lead' as const,title:'New lead',subtitle:[l.name,l.source].filter(Boolean).join(' · '),at:l.createdAt||'',href:'/admin/leads'})),
   ...state.deals.filter(d=>!d.archivedAt&&needsNextStep(d)).map(d=>({id:`next:${d.id}:${d.nextStep?.dueDate||'none'}`,kind:'next' as const,title:'Needs a next step',subtitle:d.name,at:d.nextStep?.dueDate||d.stageEnteredAt||d.createdAt||'',href:`/admin/pipeline/${d.id}`})),
   ...(state.directMessages||[]).filter(m=>m.recipientId===actor.id).map(m=>({id:`dm:${m.id}`,kind:'message' as const,title:`Message from ${person(m.senderId)}`,subtitle:m.body,at:m.createdAt,href:'/admin/messages'})),
   ...bookings.map(b=>({id:`booking:${b.id}:${b.status}`,kind:'booking' as const,title:b.status==='pending'?'Appointment request':'Upcoming appointment',subtitle:[b.title,b.customer].filter(Boolean).join(' · '),at:b.start_time,href:'/admin/bookings'})),
  ].sort((a,b)=>(b.at||'').localeCompare(a.at||'')).slice(0,30);
 },[state,actor.id,bookings]);
 const unread=items.filter(item=>!seen.includes(item.id)).length;

 // Opening the panel marks everything shown as read; the dots stay visible until it closes.
 function toggle(){
  const next=!open;setOpen(next);if(!next)return;
  setFresh(items.filter(item=>!seen.includes(item.id)).map(item=>item.id));
  const merged=[...new Set([...items.map(item=>item.id),...seen])].slice(0,MAX_SEEN);
  setSeen(merged);try{localStorage.setItem(storageKey,JSON.stringify(merged));}catch{}
 }
 return <div className="ops-bell" ref={ref}>
  <button type="button" className="ops-icon-button" aria-label={unread?`Notifications, ${unread} unread`:'Notifications'} aria-expanded={open} onClick={toggle}><Bell size={17}/>{unread>0&&<span className="ops-bell-count" aria-hidden>{unread>99?'99+':unread}</span>}</button>
  {open&&<div className="ops-popover" role="region" aria-label="Notifications">
   <div className="ops-popover-head"><b>Notifications</b>{items.length>0&&<small>{items.length} recent</small>}</div>
   <div className="ops-popover-list">{items.length?items.map(item=>{const Icon=ICON[item.kind];return <Link key={item.id} href={item.href} className={`ops-notification${fresh.includes(item.id)?' is-unread':''}`} onClick={()=>setOpen(false)}><i aria-hidden><Icon size={14}/></i><div><b>{item.title}</b>{item.subtitle&&<small>{item.subtitle}</small>}{item.at&&<small>{when(item.at)}</small>}</div></Link>;}):<p className="ops-overview-empty">You’re all caught up.</p>}</div>
  </div>}
 </div>;
}
