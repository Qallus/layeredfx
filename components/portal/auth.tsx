"use client";
import {Footer} from "@/components/layeredfx/footer";
import {Header} from '@/components/layeredfx/header';
import {EstimateProvider} from '@/components/layeredfx/estimate-context';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Check,Eye,EyeOff,Layers,MailCheck,ShieldCheck} from 'lucide-react';
import {accountTypes} from '@/lib/portal/model';

type AuthMode='login'|'register'|'forgot'|'reset';
const COPY:Record<AuthMode,{kicker:string;title:string;intro:string}>={
 login:{kicker:'Customer & partner portal',title:'Welcome back.',intro:'Sign in to manage your appointments, projects and conversations.'},
 register:{kicker:'Create your account',title:'Make room for what’s next.',intro:'Manage appointments, share project photos and message the LayeredFX team.'},
 forgot:{kicker:'Password help',title:'Reset your password.',intro:'Enter the email you use for LayeredFX and we’ll send you a secure link to choose a new password.'},
 reset:{kicker:'Password help',title:'Choose a new password.',intro:'Use at least 12 characters. You’ll use it the next time you sign in.'},
};
const DONE_TITLE:Record<AuthMode,string>={login:'',register:'Check your email.',forgot:'Check your inbox.',reset:'Password updated.'};
const ACCOUNT_TYPES:Record<string,{label:string;hint:string}>={residential:{label:'Homeowner',hint:'Residential projects'},commercial:{label:'Business',hint:'Commercial spaces'},contractor:{label:'General contractor',hint:'Partner · reviewed by our team'},affiliate:{label:'Affiliate',hint:'Partner · reviewed by our team'},vendor:{label:'Vendor',hint:'Partner · reviewed by our team'}};

export function PortalAuth({mode='login',register=false,demo=false}:{mode?:AuthMode;register?:boolean;demo?:boolean}){
 const view:AuthMode=register?'register':mode;
 const[show,setShow]=useState(false),[kind,setKind]=useState('residential'),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 // Reset links arrive with #access_token=…&type=recovery; undefined while the fragment has not been read yet.
 const[recovery,setRecovery]=useState<string|null|undefined>(undefined);
 useEffect(()=>{
  const fragment=new URLSearchParams(location.hash.slice(1)),query=new URLSearchParams(location.search);
  const prefill=query.get('email');if(prefill&&prefill.length<=254)setEmail(prefill);
  if(view==='reset'){const token=fragment.get('access_token');setRecovery(token&&fragment.get('type')==='recovery'?token:null);const failure=fragment.get('error_description');if(failure)setError(failure);}
  if(location.hash)history.replaceState(null,'',location.pathname+location.search);
 },[view]);
 useEffect(()=>{if(!demo&&view==='login')void fetch('/api/portal/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(async res=>{if(res.ok){const data=await res.json();location.assign(data.destination);}}).catch(()=>{});},[demo,view]);
 const strong=password.length>=12,matches=password.length>0&&password===confirm;
 async function submit(form:HTMLFormElement){
  setBusy(true);setError('');setMessage('');
  try{
   let action:string=view,body:Record<string,unknown>;
   if(view==='login')body={email,password};
   else if(view==='register'){if(!strong||!matches)throw Error('Check the password requirements below.');body={name:new FormData(form).get('name'),email,password,kind};}
   else if(view==='forgot')body={email};
   else{if(!recovery)throw Error('This reset link is invalid. Request a new one.');if(!strong||!matches)throw Error('Check the password requirements below.');action='reset';body={accessToken:recovery,password};}
   const response=await fetch(`/api/portal/auth/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(result.message||'Please try again.');
   if(result.destination)location.assign(result.destination);else{setMessage(result.message);setPassword('');setConfirm('');}
  }catch(e){setError(e instanceof Error?e.message:'Please try again.');}
  finally{setBusy(false);}
 }
 const copy=COPY[view],done=Boolean(message)&&view!=='login',invalidLink=view==='reset'&&recovery===null;
 return <EstimateProvider><div className="lfx"><Header/></div><main className="portal-auth"><section className="portal-auth-form">
  <span className="portal-auth-kicker">{copy.kicker}</span>
  <h1>{done?DONE_TITLE[view]:copy.title}</h1>
  {done?<div className="portal-auth-done">
   <span className="portal-auth-done-icon">{view==='reset'?<ShieldCheck size={26}/>:<MailCheck size={26}/>}</span>
   <p role="status">{message}</p>
   <Link className="portal-primary" href="/login">{view==='reset'?'Sign in':'Back to sign in'} <ArrowRight size={17}/></Link>
   {view==='forgot'&&<button type="button" className="portal-text-button" onClick={()=>setMessage('')}>Use a different email</button>}
  </div>:<>
   <p className="portal-auth-intro">{copy.intro}</p>
   {invalidLink?<div className="portal-auth-done"><p role="alert" className="portal-error">{error||'This reset link is invalid or has expired.'}</p><Link className="portal-primary" href="/forgot-password">Request a new reset link <ArrowRight size={17}/></Link></div>:
   <form onSubmit={e=>{e.preventDefault();void submit(e.currentTarget);}}>
    {view==='register'&&<fieldset className="portal-account-types"><legend>I’m signing up as</legend><div>{accountTypes.map(type=><label key={type} className="portal-type-option" data-selected={kind===type}><input type="radio" name="kind" value={type} checked={kind===type} onChange={()=>setKind(type)}/><b>{ACCOUNT_TYPES[type].label}</b><small>{ACCOUNT_TYPES[type].hint}</small></label>)}</div>{['contractor','affiliate','vendor'].includes(kind)&&<p className="portal-hint">Partner accounts are reviewed by our team before access is approved.</p>}</fieldset>}
    {view==='register'&&<label>Full name<input name="name" autoComplete="name" required maxLength={150}/></label>}
    {view!=='reset'&&<label>Email<input type="email" name="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required maxLength={254}/></label>}
    {view!=='forgot'&&<label><span className="portal-label-row">{view==='reset'?'New password':'Password'}{view==='login'&&<Link href={`/forgot-password${email?`?email=${encodeURIComponent(email)}`:''}`}>Forgot password?</Link>}</span><div className="portal-password"><input type={show?'text':'password'} name="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={view==='login'?'current-password':'new-password'} required minLength={view==='login'?1:12} maxLength={1024}/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
    {(view==='register'||view==='reset')&&<><label>Confirm password<input type={show?'text':'password'} name="confirm" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" required maxLength={1024}/></label><ul className="portal-checklist" aria-live="polite"><li data-ok={strong}><Check size={14}/>At least 12 characters</li><li data-ok={matches}><Check size={14}/>Passwords match</li></ul></>}
    {error&&<p role="alert" className="portal-error">{error}</p>}
    {message&&<p role="status" className="portal-success">{message}</p>}
    <button className="portal-primary" disabled={busy||demo}>{busy?'Please wait…':view==='login'?'Sign in':view==='register'?'Create account':view==='forgot'?'Send reset link':'Update password'}<ArrowRight size={17}/></button>
    {view==='register'&&<p className="portal-legal">By creating an account you agree to our <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>}
   </form>}
   {demo&&<div className="portal-demo-links"><p>Local preview — live accounts are not connected in this mode.</p><Link href="/portal">Preview customer portal <ArrowRight size={14}/></Link><Link href="/partner">Preview partner portal <ArrowRight size={14}/></Link></div>}
   <div className="portal-auth-switch">{view==='login'&&<p>New to LayeredFX? <Link href="/register">Create an account</Link></p>}{view==='register'&&<p>Already have an account? <Link href="/login">Sign in</Link></p>}{(view==='forgot'||view==='reset')&&<p><Link href="/login"><ArrowLeft size={14}/>Back to sign in</Link></p>}</div>
   <Link href="/admin/login" className="portal-staff-link">Team sign-in</Link>
  </>}
 </section><aside className="portal-auth-story"><span className="portal-kicker"><ShieldCheck size={16}/> YOUR LAYEREDFX SPACE</span><h2>A new layer.<br/>A shared vision.</h2><p>From the first idea to the finishing details, keep your project and the people behind it connected.</p><div className="portal-story-art"><Layers size={100} strokeWidth={.7}/><span>Thoughtfully transformed.</span></div><div className="portal-story-bottom"><div><b>Your space</b><span>Residential & commercial</span></div><div><b>Your team</b><span>Customers & partners</span></div><div><b>Your next step</b><span>Plan. Share. Create.</span></div></div></aside></main><div className="lfx"><Footer/></div></EstimateProvider>;
}
