"use client";
// Portal account settings: change password (verifies the current password on the server).
import {useState} from 'react';
import Link from 'next/link';
import {Check,KeyRound} from 'lucide-react';

export function PortalSettings({demo,email}:{demo:boolean;email:string}){
 const[show,setShow]=useState(false),[next,setNext]=useState(''),[confirm,setConfirm]=useState('');
 const[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const long=next.length>=12,matches=next.length>0&&next===confirm;
 async function submit(form:HTMLFormElement){
  setBusy(true);setError('');setMessage('');
  try{
   const response=await fetch('/api/portal/auth/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:new FormData(form).get('currentPassword'),newPassword:next})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(result.message||'Your password could not be changed.');
   form.reset();setNext('');setConfirm('');setMessage(result.message);
  }catch(e){setError(e instanceof Error?e.message:'Your password could not be changed.');}
  finally{setBusy(false);}
 }
 return <div className="portal-settings"><section className="portal-card">
  <div className="portal-settings-head"><KeyRound size={22}/><div><h2>Password</h2><p>Signed in as {email}. Use at least 12 characters.</p></div></div>
  <form onSubmit={e=>{e.preventDefault();if(long&&matches)void submit(e.currentTarget);}}>
   <label>Current password<input type={show?'text':'password'} name="currentPassword" autoComplete="current-password" required maxLength={1024}/></label>
   <label>New password<input type={show?'text':'password'} value={next} onChange={e=>setNext(e.target.value)} autoComplete="new-password" required minLength={12} maxLength={1024}/></label>
   <label>Confirm new password<input type={show?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" required maxLength={1024}/></label>
   <ul className="portal-checklist" aria-live="polite"><li data-ok={long}><Check size={14}/>At least 12 characters</li><li data-ok={matches}><Check size={14}/>Passwords match</li></ul>
   <label className="portal-inline-check"><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/>Show passwords</label>
   {error&&<p role="alert" className="portal-error">{error}</p>}
   {message&&<p role="status" className="portal-success">{message}</p>}
   <div className="portal-actions"><button className="portal-primary" disabled={busy||demo||!long||!matches}>{busy?'Saving…':'Change password'}</button><Link href="/forgot-password">Forgot your current password?</Link></div>
   {demo&&<p className="portal-hint">Local preview: password changes need a live account.</p>}
  </form>
 </section></div>;
}
