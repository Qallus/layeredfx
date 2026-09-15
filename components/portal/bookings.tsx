"use client";
// Customer portal appointments: read-only details with change and cancel actions that take effect immediately.
import {useState} from 'react';
import Link from 'next/link';
import {CalendarClock,CalendarDays,Clock,Hash,MapPin,Plus,X} from 'lucide-react';
import {BookingChoices} from '@/components/layeredfx/booking-choices';
import {appointmentByName,appointmentBySlug} from '@/lib/bookings/catalog';
import type {CustomerBooking} from '@/lib/bookings/model';

const inPhoenix=(iso:string,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Phoenix',...options}).format(new Date(iso));
const clock=(iso:string)=>inPhoenix(iso,{hour:'numeric',minute:'2-digit'});
const STATUS_LABELS:Record<string,string>={pending:'Booked',confirmed:'Confirmed',rescheduled:'Rescheduled',canceled:'Canceled',completed:'Completed',no_show:'Missed'};
const statusLabel=(status:string)=>STATUS_LABELS[status]||status.replace(/_/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase());

export function PortalBookings({bookings,loadError,preview,onSaved}:{bookings:CustomerBooking[]|null;loadError:string;preview:boolean;onSaved:(booking:CustomerBooking)=>void}){
 const[notice,setNotice]=useState('');
 if(loadError)return <section className="portal-card"><p className="portal-error" role="alert">{loadError}</p></section>;
 if(!bookings)return <section className="portal-card"><p role="status">Loading your appointments…</p></section>;
 const upcoming=bookings.filter(item=>item.can_change).sort((a,b)=>a.start_time.localeCompare(b.start_time));
 const past=bookings.filter(item=>!item.can_change).sort((a,b)=>b.start_time.localeCompare(a.start_time));
 const saved=(booking:CustomerBooking,message:string)=>{onSaved(booking);setNotice(message);};
 return <div className="portal-bookings">
  {preview&&<p className="portal-hint">Local preview: showing appointments booked on this device.</p>}
  {notice&&<p role="status" className="portal-success">{notice}</p>}
  {!bookings.length&&<section className="portal-card portal-empty"><CalendarDays size={30}/><h2>No appointments yet</h2><p>When you book a consultation with this email address, it will appear here.</p><Link className="portal-primary" href="/book"><Plus size={17}/>Book an appointment</Link></section>}
  {upcoming.length>0&&<section aria-labelledby="portal-upcoming"><h2 id="portal-upcoming" className="portal-section-title">Upcoming</h2>{upcoming.map(item=><BookingCard key={item.id} booking={item} onSaved={saved}/>)}</section>}
  {past.length>0&&<section aria-labelledby="portal-past"><h2 id="portal-past" className="portal-section-title">Past &amp; canceled</h2>{past.map(item=><BookingCard key={item.id} booking={item} onSaved={saved}/>)}</section>}
 </div>;
}

function BookingCard({booking,onSaved}:{booking:CustomerBooking;onSaved:(booking:CustomerBooking,message:string)=>void}){
 const[mode,setMode]=useState<'view'|'change'|'cancel'>('view');
 const[step,setStep]=useState(1),[service,setService]=useState(booking.title),[date,setDate]=useState(''),[time,setTime]=useState('');
 const[busy,setBusy]=useState(false),[error,setError]=useState('');
 const closed=['canceled','completed','no_show'].includes(booking.status);
 async function send(change:Record<string,unknown>){
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/portal/bookings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:booking.id,revision:booking.revision,...change})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.message||'Your appointment could not be updated. Please try again.');
   const emailNote=data.email==='sent'?' A confirmation email is on its way.':'';
   setMode('view');
   onSaved(data.booking,(change.action==='cancel'?'Your appointment was canceled.':'Your appointment was updated.')+emailNote);
  }catch(e){setError(e instanceof Error?e.message:'Your appointment could not be updated. Please try again.');}
  finally{setBusy(false);}
 }
 function startChange(){setService(appointmentBySlug(booking.appointment_type)?.name??booking.title);setDate('');setTime('');setStep(1);setError('');setMode('change');}
 const newStart=date&&time?`${date}T${time}:00-07:00`:'';
 return <article className={`portal-card portal-booking${closed?' is-closed':''}`} aria-label={`${booking.title}, ${inPhoenix(booking.start_time,{month:'long',day:'numeric'})}`}>
  <div className="portal-booking-date" aria-hidden="true"><span>{inPhoenix(booking.start_time,{month:'short'})}</span><b>{inPhoenix(booking.start_time,{day:'numeric'})}</b><small>{inPhoenix(booking.start_time,{weekday:'short'})}</small></div>
  <div className="portal-booking-body">
   <div className="portal-booking-head"><h3>{booking.title}</h3><span className={`portal-booking-status is-${booking.status}`}>{statusLabel(booking.status)}</span></div>
   <ul className="portal-booking-meta">
    <li><CalendarDays size={16}/>{inPhoenix(booking.start_time,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</li>
    <li><Clock size={16}/>{clock(booking.start_time)} – {clock(booking.end_time)} Arizona time · {booking.minutes} min</li>
    <li><MapPin size={16}/>{booking.location}</li>
    <li><Hash size={16}/>Reference {booking.id.slice(0,8).toUpperCase()}</li>
   </ul>
   {booking.customer_notes&&<details className="portal-booking-notes"><summary>Your notes</summary><p>{booking.customer_notes}</p></details>}
   {error&&<p role="alert" className="portal-error">{error}</p>}
   {booking.can_change&&mode==='view'&&<div className="portal-booking-actions"><button type="button" className="portal-secondary" onClick={startChange}><CalendarClock size={16}/>Change appointment</button><button type="button" className="portal-danger-link" onClick={()=>{setError('');setMode('cancel');}}><X size={16}/>Cancel appointment</button></div>}
   {mode==='cancel'&&<div className="portal-booking-confirm" role="group" aria-label="Confirm cancellation"><p><b>Cancel this appointment?</b> This takes effect right away. You can book a new time whenever you are ready.</p><div className="portal-booking-actions"><button type="button" className="portal-danger" disabled={busy} onClick={()=>void send({action:'cancel'})}>{busy?'Canceling…':'Yes, cancel appointment'}</button><button type="button" className="portal-secondary" disabled={busy} onClick={()=>setMode('view')}>Keep appointment</button></div></div>}
   {mode==='change'&&<div className="portal-booking-change">
    <div className="portal-booking-change-head"><h4>Change appointment</h4><button type="button" className="portal-icon-button" aria-label="Close change appointment" onClick={()=>setMode('view')}><X size={18}/></button></div>
    {step<3?<BookingChoices step={step} service={service} setService={setService} date={date} setDate={setDate} time={time} setTime={setTime} next={()=>setStep(step+1)} back={()=>setStep(step-1)}/>
    :<div className="portal-booking-confirm"><p>Move your appointment to <b>{service}</b> on <b>{newStart&&inPhoenix(newStart,{weekday:'long',month:'long',day:'numeric'})}</b> at <b>{newStart&&clock(newStart)}</b> Arizona time?</p><div className="portal-booking-actions"><button type="button" className="portal-primary" disabled={busy} onClick={()=>void send({action:'reschedule',appointment:appointmentByName(service)?.slug,date,time})}>{busy?'Saving…':'Confirm change'}</button><button type="button" className="portal-secondary" disabled={busy} onClick={()=>setStep(2)}>Back</button></div></div>}
   </div>}
  </div>
 </article>;
}
