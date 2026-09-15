"use client";
// My profile, laid out like Channel Cast's profile panel: identity header, Personal info, Contact and Preferences,
// with Password & security and this session alongside. Saved to the operations store (profile.save) so it follows
// the member across devices; the sign-in email and role come from the LayeredFX account.
import {useEffect,useRef,useState} from 'react';
import {Building2,Check,Clock,ImagePlus,KeyRound,LogOut,Mail,MapPin,Monitor,Moon,Pencil,Phone,Sun,UserRound,X,type LucideIcon} from 'lucide-react';
import type {MemberProfile} from '@/lib/operations/types';
import {BrandedInput,BrandedSelect} from './branded-fields';
import {useOperations} from './provider';
import {Button,Field,Modal} from './shared';

// Keep in sync with TIMEZONES in lib/operations/engine.mjs.
const TIMEZONES=[['America/Phoenix','Arizona (MST)'],['America/Los_Angeles','Pacific Time'],['America/Denver','Mountain Time'],['America/Chicago','Central Time'],['America/New_York','Eastern Time'],['America/Anchorage','Alaska Time'],['Pacific/Honolulu','Hawaii Time'],['UTC','UTC']] as const;
const ROLE_LABEL:Record<string,string>={admin:'Admin',staff:'Staff',viewer:'Viewer'};
type Draft={fullName:string;jobTitle:string;bio:string;phone:string;company:string;location:string;timezone:string;appearance:'light'|'dark';avatarUrl:string};
const initials=(name:string)=>name.split(/\s+/).filter(Boolean).map(part=>part[0]).slice(0,2).join('').toUpperCase()||'?';
function deviceLabel(){const ua=navigator.userAgent;const browser=/Edg\//.test(ua)?'Edge':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'Browser';const os=/Windows/.test(ua)?'Windows':/iPhone|iPad/.test(ua)?'iOS':/Mac OS/.test(ua)?'macOS':/Android/.test(ua)?'Android':/Linux/.test(ua)?'Linux':'';return os?`${browser} · ${os}`:browser;}

export function ProfilePage(){
 const {state,actor,dispatch,busy,mode}=useOperations();
 const [theme,setTheme]=useState<'light'|'dark'>('light');const [device,setDevice]=useState('This browser');
 useEffect(()=>{try{setTheme(localStorage.getItem('lfx:dashboard:theme')==='dark'?'dark':'light');}catch{}setDevice(deviceLabel());},[]);
 const saved:MemberProfile=state.memberProfiles?.[actor.id]||{};
 const profile:Draft={fullName:saved.fullName||actor.name,jobTitle:saved.jobTitle||'',bio:saved.bio||'',phone:saved.phone||'',company:saved.company||'',location:saved.location||'',timezone:saved.timezone||'America/Phoenix',appearance:saved.appearance||theme,avatarUrl:saved.avatarUrl||''};
 const [editing,setEditing]=useState(false);const [draft,setDraft]=useState<Draft>(profile);const [justSaved,setJustSaved]=useState(false);
 const [uploading,setUploading]=useState(false);const [uploadError,setUploadError]=useState('');const [passwordOpen,setPasswordOpen]=useState(false);
 const fileRef=useRef<HTMLInputElement>(null);const readOnly=actor.role==='viewer';const view=editing?draft:profile;
 const set=<K extends keyof Draft>(key:K,value:Draft[K])=>setDraft(d=>({...d,[key]:value}));
 function startEdit(){setDraft(profile);setEditing(true);setJustSaved(false);setUploadError('');}
 async function save(){if(await dispatch({type:'profile.save',patch:draft})){setEditing(false);setJustSaved(true);window.dispatchEvent(new CustomEvent('lfx:dashboard-theme',{detail:draft.appearance}));setTimeout(()=>setJustSaved(false),2500);}}
 // Photos use the LayeredFX public media bucket (same upload route and checks as business card images).
 async function upload(file:File){setUploading(true);setUploadError('');try{const response=await fetch('/api/admin/business-cards/uploads',{method:'POST',headers:{'Content-Type':file.type},body:file});const data=await response.json().catch(()=>({}));if(!response.ok||typeof data.url!=='string')throw new Error(data.message||'Upload failed.');set('avatarUrl',data.url);}catch(e){setUploadError(e instanceof Error?e.message:'Upload failed.');}finally{setUploading(false);}}
 async function signOut(){await fetch('/api/operations/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});location.assign('/admin/login');}
 const timezone=TIMEZONES.find(([value])=>value===profile.timezone)?.[1]||profile.timezone;
 return <div className="ops-profile">
  <section className="ops-profile-header" aria-label="Profile summary">
   <div className="ops-profile-identity">
    <div className="ops-profile-avatar">
     {view.avatarUrl?<img src={view.avatarUrl} alt=""/>:<span aria-hidden>{initials(view.fullName)}</span>}
     {editing&&<><button type="button" className="is-change" aria-label={view.avatarUrl?'Change photo':'Add photo'} disabled={uploading} onClick={()=>fileRef.current?.click()}><ImagePlus size={14}/></button>{view.avatarUrl&&<button type="button" className="is-remove" aria-label="Remove photo" onClick={()=>set('avatarUrl','')}><X size={12}/></button>}</>}
     <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value='';}}/>
    </div>
    <div>
     <h1>{profile.fullName||'Your name'}</h1>
     <p>{[profile.jobTitle,actor.email].filter(Boolean).join(' · ')}</p>
     <div className="ops-profile-badges"><span className="ops-badge is-public">{ROLE_LABEL[actor.role]||actor.role}</span>{profile.location&&<span><MapPin size={12}/>{profile.location}</span>}</div>
    </div>
   </div>
   <div className="ops-actions">
    {justSaved&&<span className="ops-profile-saved" role="status"><Check size={15}/>Saved</span>}
    {editing?<><Button type="button" variant="outline" onClick={()=>{setDraft(profile);setEditing(false);}}><X size={15}/>Cancel</Button><Button type="button" disabled={busy||uploading||!draft.fullName.trim()} onClick={()=>void save()}><Check size={15}/>Save changes</Button></>
    :<Button type="button" disabled={readOnly} onClick={startEdit}><Pencil size={15}/>Edit profile</Button>}
   </div>
  </section>
  {readOnly&&<p className="ops-info">Viewer accounts are read-only, so this profile can’t be edited.</p>}
  {uploadError&&<p className="ops-error" role="alert">{uploadError}</p>}

  <div className="ops-profile-grid">
   <div className="ops-profile-col">
    <Card title="Personal info" description="Your name and how you show up across the dashboard.">
     {editing?<div className="ops-profile-fields">
      <div className="is-wide"><Field label="Photo link"><BrandedInput type="url" maxLength={1000} placeholder="https://…" value={draft.avatarUrl} onChange={e=>set('avatarUrl',e.target.value)}/></Field><p className="ops-muted">Upload with the photo button, or paste an https link.{mode==='demo'?' Uploads need the LayeredFX storage bucket, so use a link in this preview.':''} If no photo is set, your initials are used.</p></div>
      <Field label="Full name"><BrandedInput required maxLength={200} value={draft.fullName} onChange={e=>set('fullName',e.target.value)}/></Field>
      <Field label="Job title"><BrandedInput maxLength={150} value={draft.jobTitle} onChange={e=>set('jobTitle',e.target.value)}/></Field>
      <div className="is-wide"><Field label="Bio"><textarea rows={3} maxLength={1000} placeholder="A short line about your role" value={draft.bio} onChange={e=>set('bio',e.target.value)}/></Field></div>
     </div>:<div className="ops-profile-fields">
      <Value icon={UserRound} label="Full name" value={profile.fullName}/>
      <Value label="Job title" value={profile.jobTitle}/>
      <div className="is-wide"><Value label="Bio" value={profile.bio}/></div>
     </div>}
    </Card>
    <Card title="Contact" description="How teammates can reach you.">
     {editing?<div className="ops-profile-fields">
      <div className="is-wide"><Field label="Email"><BrandedInput type="email" value={actor.email||''} disabled readOnly/></Field><p className="ops-muted">Your sign-in email is managed by a LayeredFX administrator.</p></div>
      <Field label="Phone"><BrandedInput type="tel" maxLength={60} value={draft.phone} onChange={e=>set('phone',e.target.value)}/></Field>
      <Field label="Company"><BrandedInput maxLength={200} value={draft.company} onChange={e=>set('company',e.target.value)}/></Field>
      <Field label="Location"><BrandedInput maxLength={150} placeholder="e.g. Scottsdale, AZ" value={draft.location} onChange={e=>set('location',e.target.value)}/></Field>
      <Field label="Timezone"><BrandedSelect value={draft.timezone} onChange={e=>set('timezone',e.target.value)}>{TIMEZONES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</BrandedSelect></Field>
     </div>:<div className="ops-profile-fields">
      <Value icon={Mail} label="Email" value={actor.email||''}/>
      <Value icon={Phone} label="Phone" value={profile.phone}/>
      <Value icon={Building2} label="Company" value={profile.company}/>
      <Value icon={MapPin} label="Location" value={profile.location}/>
      <Value icon={Clock} label="Timezone" value={timezone}/>
     </div>}
    </Card>
    <Card title="Preferences" description="Personal settings for the dashboard.">
     {editing?<div className="ops-profile-fields">
      <Field label="Appearance"><BrandedSelect value={draft.appearance} onChange={e=>set('appearance',e.target.value as Draft['appearance'])}><option value="light">Light</option><option value="dark">Dark</option></BrandedSelect></Field>
     </div>:<div className="ops-profile-fields">
      <Value icon={profile.appearance==='dark'?Moon:Sun} label="Appearance" value={profile.appearance==='dark'?'Dark':'Light'}/>
     </div>}
    </Card>
   </div>

   <div className="ops-profile-col">
    <Card title="Password & security" description="Keep your account protected.">
     <div className="ops-profile-row">
      <div className="ops-profile-value"><KeyRound size={16} aria-hidden/><div><b>Password</b><small>{mode==='demo'?'Available when signed in to LayeredFX':'Change the password you use to sign in'}</small></div></div>
      <Button type="button" size="sm" variant="outline" disabled={mode==='demo'} onClick={()=>setPasswordOpen(true)}>Change</Button>
     </div>
    </Card>
    <Card title="This session" description="The browser you are using right now.">
     <div className="ops-profile-row">
      <div className="ops-profile-value"><Monitor size={16} aria-hidden/><div><b>{device}</b><small>This device</small></div></div>
      <span className="ops-badge is-public">Active now</span>
     </div>
     {mode==='supabase'?<Button type="button" variant="outline" onClick={()=>void signOut()}><LogOut size={15}/>Sign out</Button>:<p className="ops-muted">Local preview. Sign-in sessions are not used in this mode.</p>}
    </Card>
   </div>
  </div>
  {passwordOpen&&<PasswordModal onClose={()=>setPasswordOpen(false)}/>}
 </div>;
}

function Card({title,description,children}:{title:string;description:string;children:React.ReactNode}){
 return <section className="ops-profile-card"><header><h2>{title}</h2><p>{description}</p></header><div>{children}</div></section>;
}
function Value({icon:Icon,label,value}:{icon?:LucideIcon;label:string;value:string}){
 return <div className="ops-profile-value">{Icon&&<Icon size={16} aria-hidden/>}<div><small>{label}</small><b className={value?'':'is-empty'}>{value||'Not set'}</b></div></div>;
}

function PasswordModal({onClose}:{onClose:()=>void}){
 const [form,setForm]=useState({current:'',next:'',confirm:''});const [error,setError]=useState('');const [done,setDone]=useState('');const [saving,setSaving]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');
  if(form.next.length<12)return setError('Use a new password of at least 12 characters.');
  if(form.next!==form.confirm)return setError('The new passwords don’t match.');
  setSaving(true);
  try{const response=await fetch('/api/operations/auth/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:form.current,newPassword:form.next}),cache:'no-store'});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||'Your password was not changed.');setDone(data.message||'Password updated.');setForm({current:'',next:'',confirm:''});}
  catch(err){setError(err instanceof Error?err.message:'Your password was not changed.');}
  finally{setSaving(false);}
 }
 return <Modal open title="Change password" description="Use at least 12 characters. You’ll use it the next time you sign in." onClose={onClose}>
  {done?<><p role="status">{done}</p><div className="ops-actions"><Button type="button" onClick={onClose}>Done</Button></div></>
  :<form onSubmit={submit}>
   <Field label="Current password"><BrandedInput type="password" autoComplete="current-password" required value={form.current} onChange={e=>setForm({...form,current:e.target.value})}/></Field>
   <Field label="New password"><BrandedInput type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={form.next} onChange={e=>setForm({...form,next:e.target.value})}/></Field>
   <Field label="Confirm new password"><BrandedInput type="password" autoComplete="new-password" required maxLength={128} value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})}/></Field>
   {error&&<p className="ops-error" role="alert">{error}</p>}
   <div className="ops-actions"><Button type="submit" disabled={saving}>{saving?'Updating…':'Update password'}</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
  </form>}
 </Modal>;
}
