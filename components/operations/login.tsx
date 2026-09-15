"use client";
// Team sign-in for the operations dashboard. It shares the portal sign-in layout so both login pages look the same,
// but it keeps its own endpoint (/api/operations/auth/login): team accounts are checked against LayeredFX membership,
// and customer/partner accounts sign in at /login instead.
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowRight,Eye,EyeOff,ShieldCheck} from 'lucide-react';
import {Footer} from '@/components/layeredfx/footer';
import {Header} from '@/components/layeredfx/header';
import {EstimateProvider} from '@/components/layeredfx/estimate-context';
import {AuthStoryAnimation} from '@/components/portal/auth-animations';
import '@/components/portal/portal.css';

export function LoginScreen(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 // An existing team session goes straight to the dashboard.
 useEffect(()=>{let active=true;fetch('/api/operations/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>{if(r.ok&&active)location.assign('/admin');}).catch(()=>{});return()=>{active=false;};},[]);
 async function submit(){
  setBusy(true);setError('');
  try{
   const res=await fetch('/api/operations/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(data.message||'Sign-in failed.');
   location.assign('/admin');
  }catch(e){setError(e instanceof Error?e.message:'Sign-in failed.');}
  finally{setBusy(false);}
 }
 return <EstimateProvider><div className="lfx"><Header/></div><main className="portal-auth"><section className="portal-auth-form">
  <span className="portal-auth-kicker">LayeredFX team</span>
  <h1>Team sign-in.</h1>
  <p className="portal-auth-intro">Sign in to the LayeredFX operations dashboard with an account added to your team.</p>
  <form onSubmit={e=>{e.preventDefault();void submit();}}>
   <label>Email<input type="email" name="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required maxLength={254}/></label>
   {/* Password resets go through the shared Supabase project, so the portal reset flow also covers team accounts. */}
   <label><span className="portal-label-row">Password<Link href={`/forgot-password${email?`?email=${encodeURIComponent(email)}`:''}`}>Forgot password?</Link></span><div className="portal-password"><input type={show?'text':'password'} name="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required maxLength={1024}/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
   {error&&<p role="alert" className="portal-error">{error}</p>}
   <button className="portal-primary" disabled={busy}>{busy?'Signing in…':'Sign in'}<ArrowRight size={17}/></button>
  </form>
  <div className="portal-auth-switch"><p>Customer or partner? <Link href="/login">Sign in to your portal</Link></p></div>
  <Link href="/" className="portal-staff-link">Return to the website</Link>
 </section><aside className="portal-auth-story">
  <span className="portal-kicker"><ShieldCheck size={16}/> LAYEREDFX OPERATIONS</span>
  <h2>Layered products<br/>with designs,<br/><em>equals Layered FX.</em></h2>
  <p>Pipeline, bookings, production and your team in one place, from the first lead to the finished install.</p>
  <AuthStoryAnimation/>
  <div className="portal-story-bottom"><div><b>Pipeline</b><span>Leads to won jobs</span></div><div><b>Schedule</b><span>Bookings & production</span></div><div><b>Team</b><span>Tasks, cards & agents</span></div></div>
 </aside></main><div className="lfx"><Footer/></div></EstimateProvider>;
}
