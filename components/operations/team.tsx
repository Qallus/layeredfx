"use client";
// LFX Team and Partners: profiles managed in the dashboard, adapted from Constructed Matter's dashboard/team.
// Profiles live in the operations store and only administrators change them. A profile appears on the public
// About page only when it is active and switched to public; email and phone need their own opt-in.
import {useMemo,useState} from 'react';
import {ArrowDown,ArrowUp,ArrowUpRight,Globe,Mail,MapPin,Pencil,Phone,Plus,Trash2,UserRound,X} from 'lucide-react';
import type {ProfileGroup,TeamMember} from '@/lib/operations/types';
import {PARTNER_GROUPS,PROFILE_GROUP_LABELS} from '@/lib/profiles/public';
import {BrandedInput,BrandedSelect} from './branded-fields';
import {useOperations} from './provider';
import {Button,Empty,Field,Modal,PageTitle,SearchBox,Views} from './shared';

type Scope='team'|'partners';
type Visibility='dashboard'|'public';
type Draft={name:string;title:string;department:string;company:string;website:string;location:string;email:string;phone:string;status:'active'|'inactive';group:ProfileGroup;visibility:Visibility;showContact:boolean;tagline:string;bio:string;availability:string;photoUrl:string;secondaryPhotoUrl:string;attributes:string[]};
const COPY:Record<Scope,{title:string;description:string;add:string;empty:string;noun:string}>={
 team:{title:'LFX Team',description:'Employee profiles for the LayeredFX team.',add:'Add team member',empty:'No team profiles yet.',noun:'team member'},
 partners:{title:'Partners',description:'Installers, designers & artists, general contractors and vendors you work with.',add:'Add partner',empty:'No partner profiles yet.',noun:'partner'},
};
const groupOf=(m:Pick<TeamMember,'group'>)=>(m.group||'team') as ProfileGroup;
const toDraft=(scope:Scope,m?:TeamMember):Draft=>({name:m?.name||'',title:m?.title||'',department:m?.department||'',company:m?.company||'',website:m?.website||'',location:m?.location||'',email:m?.email||'',phone:m?.phone||'',status:m?.status||'active',group:m?groupOf(m):scope==='team'?'team':'installer',visibility:m?.visibility||'dashboard',showContact:Boolean(m?.showContact),tagline:m?.tagline||'',bio:m?.bio||'',availability:m?.availability||'',photoUrl:m?.photoUrl||'',secondaryPhotoUrl:m?.secondaryPhotoUrl||'',attributes:m?.attributes||[]});
const initials=(name:string)=>name.split(/\s+/).filter(Boolean).map(part=>part[0]).slice(0,2).join('').toUpperCase();

function Avatar({member,size='md'}:{member:Pick<TeamMember,'name'|'photoUrl'>;size?:'md'|'lg'}){
 return member.photoUrl?<img className={`ops-team-avatar is-${size}`} src={member.photoUrl} alt=""/>:<span className={`ops-team-avatar is-${size}`} aria-hidden>{initials(member.name)||<UserRound size={16}/>}</span>;
}

/** One switch per profile: public on the About page, or dashboard only. */
function VisibilitySwitch({member,disabled}:{member:TeamMember;disabled:boolean}){
 const {dispatch,busy}=useOperations();const isPublic=member.visibility==='public';
 return <label className="ops-switch"><input type="checkbox" role="switch" aria-label={`Show ${member.name} on the About page`} checked={isPublic} disabled={disabled||busy} onChange={e=>void dispatch({type:'team.save',id:member.id,patch:{visibility:e.target.checked?'public':'dashboard'}})}/><span aria-hidden/>{isPublic?'Public on About page':'Dashboard only'}</label>;
}

export function TeamPage(){return <ProfilesPage scope="team"/>;}
export function PartnersPage(){return <ProfilesPage scope="partners"/>;}

function ProfilesPage({scope}:{scope:Scope}){
 const {state,actor,dispatch,busy}=useOperations();const admin=actor.role==='admin';const copy=COPY[scope];
 const [query,setQuery]=useState('');const [status,setStatus]=useState('all');const [visibility,setVisibility]=useState('all');const [group,setGroup]=useState('all');const [view,setView]=useState('cards');
 const [editing,setEditing]=useState<TeamMember|'new'|null>(null);const [removing,setRemoving]=useState<TeamMember|null>(null);
 const profiles=useMemo(()=>[...(state.team||[])].filter(m=>scope==='team'?groupOf(m)==='team':PARTNER_GROUPS.includes(groupOf(m))).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0)),[state.team,scope]);
 const shown=profiles.filter(m=>(status==='all'||m.status===status)&&(visibility==='all'||(m.visibility||'dashboard')===visibility)&&(group==='all'||groupOf(m)===group)&&[m.name,m.title,m.company,m.department,m.email,m.location].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const live=profiles.filter(m=>m.visibility==='public'&&m.status==='active').length;
 const subtitle=(m:TeamMember)=>[m.title,m.company||m.department].filter(Boolean).join(' · ');
 const actions=(m:TeamMember)=>{const siblings=profiles.filter(x=>groupOf(x)===groupOf(m));const i=siblings.findIndex(x=>x.id===m.id);return <div className="ops-team-actions">
  <button type="button" aria-label={`Move ${m.name} up`} disabled={busy||i<=0} onClick={()=>void dispatch({type:'team.move',id:m.id,direction:'up'})}><ArrowUp size={15}/></button>
  <button type="button" aria-label={`Move ${m.name} down`} disabled={busy||i>=siblings.length-1} onClick={()=>void dispatch({type:'team.move',id:m.id,direction:'down'})}><ArrowDown size={15}/></button>
  <button type="button" aria-label={`Edit ${m.name}`} onClick={()=>setEditing(m)}><Pencil size={15}/></button>
  <button type="button" aria-label={`Remove ${m.name}`} onClick={()=>setRemoving(m)}><Trash2 size={15}/></button>
 </div>;};
 return <>
  <PageTitle eyebrow="LAYEREDFX / CMS" title={copy.title} description={copy.description}>{admin&&<Button onClick={()=>setEditing('new')}><Plus size={16}/>{copy.add}</Button>}</PageTitle>
  <div className="ops-profile-note"><p><b>{live}</b> {live===1?'profile is':'profiles are'} live on the public About page. Only active profiles switched to public appear there, and email and phone stay private unless you allow them.</p><Button asChild variant="outline" size="sm"><a href="/about" target="_blank" rel="noreferrer">View About page <ArrowUpRight size={14}/></a></Button></div>
  {!admin&&<p className="ops-info">Only administrators can add or change profiles.</p>}
  <div className="ops-toolbar">
   <SearchBox value={query} onChange={setQuery} placeholder={scope==='team'?'Search the team…':'Search partners…'}/>
   {scope==='partners'&&<BrandedSelect aria-label="Filter by partner type" value={group} onChange={e=>setGroup(e.target.value)}><option value="all">All partner types</option>{PARTNER_GROUPS.map(g=><option key={g} value={g}>{PROFILE_GROUP_LABELS[g].plural}</option>)}</BrandedSelect>}
   <BrandedSelect aria-label="Filter by visibility" value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="all">Public and dashboard</option><option value="public">Public</option><option value="dashboard">Dashboard only</option></BrandedSelect>
   <BrandedSelect aria-label="Filter by status" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></BrandedSelect>
   <Views values={['cards','list']} value={view} onChange={setView}/>
  </div>
  {!profiles.length?<Empty>{copy.empty}{admin?` Add your first ${copy.noun} to get started.`:''}</Empty>
  :!shown.length?<Empty>No profiles match these filters.</Empty>
  :view==='cards'?<div className="ops-team-grid">{shown.map(m=><article className="ops-team-card" key={m.id}>
    <div className="ops-team-card-head"><Avatar member={m} size="lg"/><div>{scope==='partners'&&<span className="ops-team-type">{PROFILE_GROUP_LABELS[groupOf(m)].label}</span>}<h2>{m.name}</h2><p>{subtitle(m)||'No title yet'}</p></div><span className={`ops-badge${m.status==='inactive'?' is-muted':''}`}>{m.status}</span></div>
    {m.tagline&&<p className="ops-team-tagline">{m.tagline}</p>}
    {!!m.attributes?.length&&<div className="ops-team-attributes">{m.attributes.map(a=><span key={a}>{a}</span>)}</div>}
    {(m.email||m.phone||m.website||m.location)&&<div className="ops-team-contact">{m.location&&<span><MapPin size={14}/>{m.location}</span>}{m.website&&<a href={m.website} target="_blank" rel="noreferrer"><Globe size={14}/>{m.website.replace(/^https:\/\//,'')}</a>}{m.email&&<a href={`mailto:${m.email}`}><Mail size={14}/>{m.email}</a>}{m.phone&&<a href={`tel:${m.phone}`}><Phone size={14}/>{m.phone}</a>}</div>}
    <div className="ops-profile-visibility"><VisibilitySwitch member={m} disabled={!admin}/>{m.visibility==='public'&&m.status!=='active'&&<small className="ops-warning">Inactive, so hidden from the About page</small>}{m.visibility==='public'&&m.showContact&&<small className="ops-muted">Email and phone shown</small>}</div>
    {admin&&actions(m)}
   </article>)}</div>
  :<div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Name</th>{scope==='partners'&&<th>Type</th>}<th>Title</th><th>Contact</th><th>Status</th><th>About page</th>{admin&&<th>Actions</th>}</tr></thead><tbody>{shown.map(m=><tr key={m.id}><td><span className="ops-team-name"><Avatar member={m}/>{m.name}</span></td>{scope==='partners'&&<td>{PROFILE_GROUP_LABELS[groupOf(m)].label}</td>}<td>{subtitle(m)}</td><td><small>{m.email}</small><small>{m.phone}</small></td><td><span className={`ops-badge${m.status==='inactive'?' is-muted':''}`}>{m.status}</span></td><td><VisibilitySwitch member={m} disabled={!admin}/></td>{admin&&<td>{actions(m)}</td>}</tr>)}</tbody></table></div>}
  {editing&&<ProfileForm scope={scope} member={editing==='new'?undefined:editing} onClose={()=>setEditing(null)}/>}
  {removing&&<Modal open title={`Remove ${removing.name}?`} description="The profile is deleted from the dashboard and removed from the About page." onClose={()=>setRemoving(null)}><div className="ops-actions"><Button disabled={busy} onClick={async()=>{if(await dispatch({type:'team.delete',id:removing.id}))setRemoving(null);}}>Remove profile</Button><Button type="button" variant="outline" onClick={()=>setRemoving(null)}>Cancel</Button></div></Modal>}
 </>;
}

function ProfileForm({scope,member,onClose}:{scope:Scope;member?:TeamMember;onClose:()=>void}){
 const {dispatch,busy,mode}=useOperations();const [draft,setDraft]=useState<Draft>(()=>toDraft(scope,member));
 const [attribute,setAttribute]=useState('');const [uploading,setUploading]=useState<''|'photoUrl'|'secondaryPhotoUrl'>('');const [uploadError,setUploadError]=useState('');
 const set=(key:keyof Draft)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setDraft(d=>({...d,[key]:e.target.value}));
 const partner=scope==='partners';
 // Headshots use the LayeredFX public media bucket (same upload route and checks as business card images).
 async function upload(key:'photoUrl'|'secondaryPhotoUrl',file:File){
  setUploading(key);setUploadError('');
  try{const response=await fetch('/api/admin/business-cards/uploads',{method:'POST',headers:{'Content-Type':file.type},body:file});const data=await response.json().catch(()=>({}));if(!response.ok||typeof data.url!=='string')throw new Error(data.message||data.error||'Upload failed.');setDraft(d=>({...d,[key]:data.url}));}
  catch(e){setUploadError(e instanceof Error?e.message:'Upload failed.');}
  finally{setUploading('');}
 }
 function addAttribute(){const value=attribute.trim();if(value&&!draft.attributes.includes(value)&&draft.attributes.length<12)setDraft(d=>({...d,attributes:[...d.attributes,value]}));setAttribute('');}
 const {department,...partnerPatch}=draft;
 return <Modal open title={member?`Edit ${member.name}`:COPY[scope].add} description="Dashboard-only profiles are visible to signed-in staff only." onClose={onClose}>
  <form onSubmit={async e=>{e.preventDefault();if(await dispatch({type:'team.save',id:member?.id,patch:partner?{...partnerPatch,department:member?.department||''}:{...draft,group:'team'}}))onClose();}}>
   <div className="ops-form-grid">
    <Field label={partner?'Name':'Full name'}><BrandedInput required maxLength={200} value={draft.name} onChange={set('name')}/></Field>
    {partner?<Field label="Partner type"><BrandedSelect value={draft.group} onChange={set('group')}>{PARTNER_GROUPS.map(g=><option key={g} value={g}>{PROFILE_GROUP_LABELS[g].label}</option>)}</BrandedSelect></Field>:<Field label="Job title"><BrandedInput maxLength={150} value={draft.title} onChange={set('title')}/></Field>}
    {partner?<Field label="Company"><BrandedInput maxLength={200} value={draft.company} onChange={set('company')}/></Field>:<Field label="Department"><BrandedInput maxLength={120} value={department} onChange={set('department')}/></Field>}
    {partner&&<Field label="Role or specialty"><BrandedInput maxLength={150} value={draft.title} onChange={set('title')}/></Field>}
    <Field label="Status"><BrandedSelect value={draft.status} onChange={set('status')}><option value="active">Active</option><option value="inactive">Inactive</option></BrandedSelect></Field>
    <Field label="Location"><BrandedInput maxLength={150} placeholder="e.g. Scottsdale, AZ" value={draft.location} onChange={set('location')}/></Field>
    <Field label="Email"><BrandedInput type="email" maxLength={254} value={draft.email} onChange={set('email')}/></Field>
    <Field label="Phone"><BrandedInput type="tel" maxLength={60} value={draft.phone} onChange={set('phone')}/></Field>
    {partner&&<Field label="Website"><BrandedInput type="url" maxLength={500} placeholder="https://…" value={draft.website} onChange={set('website')}/></Field>}
   </div>
   <fieldset className="ops-profile-visibility-field">
    <legend>About page</legend>
    <label className="ops-switch"><input type="checkbox" role="switch" checked={draft.visibility==='public'} onChange={e=>setDraft(d=>({...d,visibility:e.target.checked?'public':'dashboard'}))}/><span aria-hidden/>Show this profile on the public About page</label>
    <label className="ops-inline"><input type="checkbox" checked={draft.showContact} onChange={e=>setDraft(d=>({...d,showContact:e.target.checked}))}/>Also show email and phone publicly</label>
    <p className="ops-muted">Only active profiles switched to public appear on layeredfx.com/about.</p>
   </fieldset>
   <Field label="Tagline"><BrandedInput maxLength={200} placeholder="A short line shown on the profile card" value={draft.tagline} onChange={set('tagline')}/></Field>
   <Field label="Bio"><textarea rows={4} maxLength={4000} value={draft.bio} onChange={set('bio')}/></Field>
   <Field label="Availability"><BrandedInput maxLength={200} placeholder="e.g. Mon–Fri, 8am–5pm" value={draft.availability} onChange={set('availability')}/></Field>
   <div className="ops-form-grid">{(['photoUrl','secondaryPhotoUrl'] as const).map(key=><Field key={key} label={key==='photoUrl'?(partner?'Photo or logo':'Profile photo'):'Secondary photo'}>
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
   <div className="ops-actions"><Button type="submit" disabled={busy||Boolean(uploading)}>{member?'Save changes':COPY[scope].add}</Button><Button type="button" variant="outline" onClick={onClose}>Cancel</Button></div>
  </form>
 </Modal>;
}
