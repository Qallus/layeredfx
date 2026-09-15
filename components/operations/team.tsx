"use client";
// LFX Team: employee profiles managed in the dashboard, adapted from Constructed Matter's dashboard/team.
// Profiles live in the operations store; only administrators can add, edit, reorder or remove them.
import {useMemo,useState} from 'react';
import {ArrowDown,ArrowUp,Mail,Pencil,Phone,Plus,Trash2,UserRound,X} from 'lucide-react';
import type {TeamMember} from '@/lib/operations/types';
import {BrandedInput,BrandedSelect} from './branded-fields';
import {useOperations} from './provider';
import {Button,Empty,Field,Modal,PageTitle,SearchBox,Views} from './shared';

type Draft={name:string;title:string;department:string;email:string;phone:string;status:'active'|'inactive';tagline:string;bio:string;availability:string;photoUrl:string;secondaryPhotoUrl:string;attributes:string[]};
const toDraft=(m?:TeamMember):Draft=>({name:m?.name||'',title:m?.title||'',department:m?.department||'',email:m?.email||'',phone:m?.phone||'',status:m?.status||'active',tagline:m?.tagline||'',bio:m?.bio||'',availability:m?.availability||'',photoUrl:m?.photoUrl||'',secondaryPhotoUrl:m?.secondaryPhotoUrl||'',attributes:m?.attributes||[]});
const initials=(name:string)=>name.split(/\s+/).filter(Boolean).map(part=>part[0]).slice(0,2).join('').toUpperCase();

function Avatar({member,size='md'}:{member:Pick<TeamMember,'name'|'photoUrl'>;size?:'md'|'lg'}){
 return member.photoUrl?<img className={`ops-team-avatar is-${size}`} src={member.photoUrl} alt=""/>:<span className={`ops-team-avatar is-${size}`} aria-hidden>{initials(member.name)||<UserRound size={16}/>}</span>;
}

export function TeamPage(){
 const {state,actor,dispatch,busy}=useOperations();const admin=actor.role==='admin';
 const [query,setQuery]=useState('');const [status,setStatus]=useState('all');const [view,setView]=useState('cards');
 const [editing,setEditing]=useState<TeamMember|'new'|null>(null);const [removing,setRemoving]=useState<TeamMember|null>(null);
 const team=useMemo(()=>[...(state.team||[])].sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0)),[state.team]);
 const shown=team.filter(m=>(status==='all'||m.status===status)&&[m.name,m.title,m.department,m.email].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const actions=(m:TeamMember)=>{const i=team.findIndex(x=>x.id===m.id);return <div className="ops-team-actions">
  <button type="button" aria-label={`Move ${m.name} up`} disabled={busy||i<=0} onClick={()=>void dispatch({type:'team.move',id:m.id,direction:'up'})}><ArrowUp size={15}/></button>
  <button type="button" aria-label={`Move ${m.name} down`} disabled={busy||i>=team.length-1} onClick={()=>void dispatch({type:'team.move',id:m.id,direction:'down'})}><ArrowDown size={15}/></button>
  <button type="button" aria-label={`Edit ${m.name}`} onClick={()=>setEditing(m)}><Pencil size={15}/></button>
  <button type="button" aria-label={`Remove ${m.name}`} onClick={()=>setRemoving(m)}><Trash2 size={15}/></button>
 </div>;};
 return <>
  <PageTitle eyebrow="LAYEREDFX / CMS" title="LFX Team" description="Employee profiles for the LayeredFX team.">{admin&&<Button onClick={()=>setEditing('new')}><Plus size={16}/>Add team member</Button>}</PageTitle>
  {!admin&&<p className="ops-info">Only administrators can add or change team profiles.</p>}
  <div className="ops-toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search the team…"/><BrandedSelect aria-label="Filter by status" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></BrandedSelect><Views values={['cards','list']} value={view} onChange={setView}/></div>
  {!team.length?<Empty>No team profiles yet.{admin?' Add your first teammate to get started.':''}</Empty>
  :!shown.length?<Empty>No team members match these filters.</Empty>
  :view==='cards'?<div className="ops-team-grid">{shown.map(m=><article className="ops-team-card" key={m.id}>
    <div className="ops-team-card-head"><Avatar member={m} size="lg"/><div><h2>{m.name}</h2><p>{[m.title,m.department].filter(Boolean).join(' · ')||'No title yet'}</p></div><span className={`ops-badge${m.status==='inactive'?' is-muted':''}`}>{m.status}</span></div>
    {m.tagline&&<p className="ops-team-tagline">{m.tagline}</p>}
    {!!m.attributes?.length&&<div className="ops-team-attributes">{m.attributes.map(a=><span key={a}>{a}</span>)}</div>}
    {(m.email||m.phone||m.availability)&&<div className="ops-team-contact">{m.email&&<a href={`mailto:${m.email}`}><Mail size={14}/>{m.email}</a>}{m.phone&&<a href={`tel:${m.phone}`}><Phone size={14}/>{m.phone}</a>}{m.availability&&<span>{m.availability}</span>}</div>}
    {admin&&actions(m)}
   </article>)}</div>
  :<div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Name</th><th>Title</th><th>Department</th><th>Contact</th><th>Status</th>{admin&&<th>Actions</th>}</tr></thead><tbody>{shown.map(m=><tr key={m.id}><td><span className="ops-team-name"><Avatar member={m}/>{m.name}</span></td><td>{m.title}</td><td>{m.department}</td><td><small>{m.email}</small><small>{m.phone}</small></td><td><span className={`ops-badge${m.status==='inactive'?' is-muted':''}`}>{m.status}</span></td>{admin&&<td>{actions(m)}</td>}</tr>)}</tbody></table></div>}
  {editing&&<TeamForm member={editing==='new'?undefined:editing} onClose={()=>setEditing(null)}/>}
  {removing&&<Modal open title={`Remove ${removing.name}?`} description="The profile is deleted from the LFX Team list." onClose={()=>setRemoving(null)}><div className="ops-actions"><Button disabled={busy} onClick={async()=>{if(await dispatch({type:'team.delete',id:removing.id}))setRemoving(null);}}>Remove profile</Button><Button type="button" variant="outline" onClick={()=>setRemoving(null)}>Cancel</Button></div></Modal>}
 </>;
}

function TeamForm({member,onClose}:{member?:TeamMember;onClose:()=>void}){
 const {dispatch,busy,mode}=useOperations();const [draft,setDraft]=useState<Draft>(()=>toDraft(member));
 const [attribute,setAttribute]=useState('');const [uploading,setUploading]=useState<''|'photoUrl'|'secondaryPhotoUrl'>('');const [uploadError,setUploadError]=useState('');
 const set=(key:keyof Draft)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setDraft(d=>({...d,[key]:e.target.value}));
 // Headshots use the LayeredFX public media bucket (same upload route and checks as business card images).
 async function upload(key:'photoUrl'|'secondaryPhotoUrl',file:File){
  setUploading(key);setUploadError('');
  try{const response=await fetch('/api/admin/business-cards/uploads',{method:'POST',headers:{'Content-Type':file.type},body:file});const data=await response.json().catch(()=>({}));if(!response.ok||typeof data.url!=='string')throw new Error(data.message||data.error||'Upload failed.');setDraft(d=>({...d,[key]:data.url}));}
  catch(e){setUploadError(e instanceof Error?e.message:'Upload failed.');}
  finally{setUploading('');}
 }
 function addAttribute(){const value=attribute.trim();if(value&&!draft.attributes.includes(value)&&draft.attributes.length<12)setDraft(d=>({...d,attributes:[...d.attributes,value]}));setAttribute('');}
 return <Modal open title={member?`Edit ${member.name}`:'Add team member'} description="Profiles are visible to everyone signed in to the dashboard." onClose={onClose}>
  <form onSubmit={async e=>{e.preventDefault();if(await dispatch({type:'team.save',id:member?.id,patch:draft}))onClose();}}>
   <div className="ops-form-grid">
    <Field label="Full name"><BrandedInput required maxLength={200} value={draft.name} onChange={set('name')}/></Field>
    <Field label="Job title"><BrandedInput maxLength={150} value={draft.title} onChange={set('title')}/></Field>
    <Field label="Department"><BrandedInput maxLength={120} value={draft.department} onChange={set('department')}/></Field>
    <Field label="Status"><BrandedSelect value={draft.status} onChange={set('status')}><option value="active">Active</option><option value="inactive">Inactive</option></BrandedSelect></Field>
    <Field label="Email"><BrandedInput type="email" maxLength={254} value={draft.email} onChange={set('email')}/></Field>
    <Field label="Phone"><BrandedInput type="tel" maxLength={60} value={draft.phone} onChange={set('phone')}/></Field>
   </div>
   <Field label="Tagline"><BrandedInput maxLength={200} placeholder="A short line shown on the profile card" value={draft.tagline} onChange={set('tagline')}/></Field>
   <Field label="Bio"><textarea rows={4} maxLength={4000} value={draft.bio} onChange={set('bio')}/></Field>
   <Field label="Availability"><BrandedInput maxLength={200} placeholder="e.g. Mon–Fri, 8am–5pm" value={draft.availability} onChange={set('availability')}/></Field>
   <div className="ops-form-grid">{(['photoUrl','secondaryPhotoUrl'] as const).map(key=><Field key={key} label={key==='photoUrl'?'Profile photo':'Secondary photo'}>
    <div className="ops-team-photo-field">
     <Avatar member={{name:draft.name,photoUrl:draft[key]}}/>
     <BrandedInput type="url" maxLength={1000} placeholder="https://…" value={draft[key]} onChange={set(key)}/>
     <label className="lfx-button lfx-button-outline ops-team-upload">{uploading===key?'Uploading…':'Upload'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={Boolean(uploading)} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(key,file);e.target.value='';}}/></label>
    </div>
   </Field>)}</div>
   {uploadError&&<p className="ops-error" role="alert">{uploadError}</p>}
   {mode==='demo'&&<p className="ops-muted">Local preview: uploads need the LayeredFX storage bucket. Paste an https image link instead.</p>}
   <Field label="Key attributes">
    <div className="ops-team-attribute-input">
     {!!draft.attributes.length&&<div className="ops-team-attributes">{draft.attributes.map(a=><span key={a}>{a}<button type="button" aria-label={`Remove ${a}`} onClick={()=>setDraft(d=>({...d,attributes:d.attributes.filter(x=>x!==a)}))}><X size={12}/></button></span>)}</div>}
     <BrandedInput value={attribute} maxLength={60} placeholder="Add an attribute and press Enter" onChange={e=>setAttribute(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addAttribute();}}}/>
    </div>
   </Field>
   <div className="ops-actions"><Button type="submit" disabled={busy||Boolean(uploading)}>{member?'Save changes':'Add team member'}</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
  </form>
 </Modal>;
}
