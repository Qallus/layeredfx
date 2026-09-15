"use client";
import Link from 'next/link';
import {Footer} from "./footer";
import {useState,useEffect,useRef} from 'react';
import {ArrowUpRight, CalendarCheck, CalendarDays, CheckCircle2, ChevronLeft, Clock, Hash, MapPin, MessageCircle, Layers3} from 'lucide-react';
import {BookingChoices} from './booking-choices';
import '@/components/admin/dashboard.css';
import './booking.css';
import {Header} from './header';
import {EstimateProvider} from './estimate-context';
import {Button} from './ui/button';
import {appointmentByName} from '@/lib/bookings/catalog';
import type {CustomerBooking} from '@/lib/bookings/model';

type Confirmation={booking:CustomerBooking;email:'sent'|'failed'|'skipped'};
const inPhoenix=(iso:string,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Phoenix',...options}).format(new Date(iso));
const longDate=(iso:string)=>inPhoenix(iso,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
const clock=(iso:string)=>inPhoenix(iso,{hour:'numeric',minute:'2-digit'});

export function PublicRequest({booking=false}:{booking?:boolean}) {
 const [details,setDetails]=useState<Record<string,string>>({});
 const [step,setStep]=useState(1),[service,setService]=useState('Surface consultation'),[date,setDate]=useState(''),[period,setPeriod]=useState(''),[error,setError]=useState('');
 const [busy,setBusy]=useState(false),[confirmation,setConfirmation]=useState<Confirmation|null>(null);
 // One id per booking attempt, so a retried submission cannot create a duplicate appointment.
 const requestId=useRef<string|null>(null);
 useEffect(()=>{if(!booking||new URLSearchParams(location.search).get('from')!=='studio')return;try{const draft=JSON.parse(sessionStorage.getItem('lfx:studio-booking')||'null');if(draft){const names=draft.details.name.trim().split(' ');setDetails({firstName:names[0],lastName:names.slice(1).join(' '),email:draft.details.email,phone:draft.details.phone,message:draft.summary.slice(0,3000)});setDate(draft.details.requestedAt.slice(0,10));setPeriod(draft.details.requestedAt.slice(11,16));setService('Installation consultation');}}catch{}},[booking]);
 function continueRequest(form:HTMLFormElement){
  const data=new FormData(form);
  const body=[`Name: ${data.get('name')}`,`Email: ${data.get('email')}`,`Phone: ${data.get('phone')||'Not provided'}`,`Company: ${data.get('company')||'Not provided'}`,String(data.get('message'))].join('\n');
  try{sessionStorage.setItem('lfx:public-draft',JSON.stringify({kind:'message',title:'Project inquiry',body,date:''}));location.assign('/portal/messages');}catch{setError('Your browser could not save the draft. Please enable session storage or open your account to contact the team.');}
 }
 async function bookAppointment(form:HTMLFormElement){
  const data=new FormData(form);setBusy(true);setError('');
  requestId.current??=crypto.randomUUID();
  try{
   const response=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:requestId.current,appointment:appointmentByName(service)?.slug,date,time:period,firstName:data.get('firstName'),lastName:data.get('lastName'),email:data.get('email'),phone:data.get('phone'),company:data.get('company'),message:data.get('message'),website:data.get('website')})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(result.message||'We could not book your appointment. Please try again or call us.');
   setConfirmation(result);window.scrollTo(0,0);
  }catch(e){setError(e instanceof Error?e.message:'We could not book your appointment. Please try again or call us.');}
  finally{setBusy(false);}
 }
 const field=(name:string)=>({name,value:details[name]||'',onChange:(e:{target:{value:string}})=>setDetails(d=>({...d,[name]:e.target.value}))});
 const selectedStart=date&&period?`${date}T${period}:00-07:00`:'';
 return <EstimateProvider><div className={`lfx lfx-public ${booking?'lfx-booking-page':''}`}><Header/><main id="main"><section className="lfx-public-heading"><span className="lfx-eyebrow">LAYEREDFX / {booking?'PLAN YOUR NEXT STEP':'LET’S CONNECT'}</span><h1>{booking?'A new layer starts here.':'Let’s talk about your space.'}</h1><p>{booking?'Choose a consultation, pick a date and time, and share a few project details.':'Quotes, materials, installation and the possibilities for your next project.'}</p></section><div className="lfx-public-grid lfx-container"><section className="lfx-request-card">
 {confirmation?<BookingConfirmed confirmation={confirmation}/>:<>
 {booking&&<ol className="lfx-booking-steps">{['Choose type','Date & time','Your details'].map((label,i)=><li key={label} aria-current={step===i+1?'step':undefined}><span>{step>i+1?'Done':i+1}</span>{label}</li>)}</ol>}
 {booking&&step<3?<BookingChoices step={step} service={service} setService={setService} date={date} setDate={setDate} time={period} setTime={setPeriod} next={()=>setStep(step+1)} back={()=>setStep(step-1)}/>:<form onSubmit={e=>{e.preventDefault();if(booking)void bookAppointment(e.currentTarget);else continueRequest(e.currentTarget);}}>
  <h2>{booking?'Your details':'Send a project inquiry'}</h2>
  {booking&&<p className="lfx-booking-selection">{service} · {selectedStart?`${longDate(selectedStart)} · ${clock(selectedStart)} Arizona time`:'Choose a date and time'} <button type="button" className="lfx-edit-date" onClick={()=>setStep(2)}>Edit</button></p>}
  {booking?<div className="lfx-request-pair"><label>First name<input {...field('firstName')} required autoComplete="given-name" maxLength={75}/></label><label>Last name<input {...field('lastName')} required autoComplete="family-name" maxLength={75}/></label></div>:<label>Name<input {...field('name')} required autoComplete="name" maxLength={150}/></label>}
  <label>Email<input {...field('email')} type="email" required autoComplete="email" maxLength={200}/></label>
  <div className="lfx-request-pair"><label>Phone (optional)<input {...field('phone')} type="tel" autoComplete="tel" maxLength={40}/></label><label>Company (optional)<input {...field('company')} autoComplete="organization" maxLength={200}/></label></div>
  <label>Tell us more<textarea {...field('message')} required rows={5} maxLength={3000} placeholder="Your surfaces, measurements, timeline and what you have in mind…"/></label>
  {booking&&<label className="lfx-hp" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label>}
  <p>{booking?'We’ll email you a confirmation with your appointment details. You can change or cancel online from your LayeredFX account.':'You’ll review and submit this message in your account. Sign in or register if needed. Photos and videos can be added in your portal.'}</p>
  {error&&<p role="alert" className="lfx-request-error">{error}</p>}
  {booking?<div className="lfx-request-actions"><Button variant="outline" onClick={()=>setStep(2)}><ChevronLeft size={17}/>Back</Button><Button type="submit" className="booking-continue" disabled={busy||!selectedStart}>{busy?'Booking…':'Book your appointment'}<CalendarCheck size={17}/></Button></div>:<Button type="submit">Continue to my account <ArrowUpRight size={17}/></Button>}
 </form>}
 </>}
 </section><aside><div className="lfx-public-art"><Layers3 size={74}/><span>YOUR SPACE. A NEW POSSIBILITY.</span></div><section className="lfx-request-card"><h2>Thoughtful from the first conversation.</h2><p>For homes and businesses, from a single surface to a complete transformation.</p><Link href="/book"><CalendarDays size={21}/><span>Plan a consultation<small>Pick a date and time for your consultation.</small></span><ArrowUpRight size={17}/></Link><Link href="/portal/bookings"><MessageCircle size={21}/><span>Already booked?<small>View, change or cancel in your account.</small></span><ArrowUpRight size={17}/></Link><Link href="/#services">Explore our services <ArrowUpRight size={17}/></Link></section></aside></div></main><Footer/></div></EstimateProvider>;
}

function BookingConfirmed({confirmation}:{confirmation:Confirmation}){
 const {booking,email}=confirmation;
 return <section className="lfx-booking-confirmed" aria-live="polite">
  <span className="lfx-booking-confirmed-icon"><CheckCircle2 size={30}/></span>
  <h2>You’re booked.</h2>
  <p>{email==='sent'?<>We sent a confirmation to <strong>{booking.customer_email}</strong>.</>:<>We received your booking. Our team will follow up at <strong>{booking.customer_email}</strong>.</>}</p>
  <dl className="lfx-booking-summary">
   <div><dt><CalendarDays size={17}/>Appointment</dt><dd>{booking.title}</dd></div>
   <div><dt><CalendarCheck size={17}/>Date</dt><dd>{longDate(booking.start_time)}</dd></div>
   <div><dt><Clock size={17}/>Time</dt><dd>{clock(booking.start_time)} – {clock(booking.end_time)} Arizona time · {booking.minutes} min</dd></div>
   <div><dt><MapPin size={17}/>Location</dt><dd>{booking.location}</dd></div>
   <div><dt><Hash size={17}/>Reference</dt><dd>{booking.id.slice(0,8).toUpperCase()}</dd></div>
  </dl>
  <div className="lfx-booking-next">
   <h3>Manage your appointment online</h3>
   <p>Create an account or sign in with {booking.customer_email} to change or cancel this appointment.</p>
   <div className="lfx-request-actions"><Button asChild><Link href={`/register?email=${encodeURIComponent(booking.customer_email)}`}>Create an account <ArrowUpRight size={17}/></Link></Button><Button asChild variant="outline"><Link href="/login">Sign in</Link></Button></div>
  </div>
 </section>;
}
