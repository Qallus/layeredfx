"use client";
// Contact enrichment: reads each selected contact's own website through /api/operations/enrich, then saves only the
// fields a team member ticks, through contact.save. Replacing an existing value is always an explicit choice.
import {useEffect,useMemo,useRef,useState} from 'react';
import {Play,Square} from 'lucide-react';
import {liveFetch,useOperations} from './provider';
import {Button,Modal} from './shared';
import {BrandedInput} from './branded-fields';
import type {Contact} from '@/lib/operations/types';
import './lead-finder.css';
import {enrichmentChanges,enrichmentDetails,websiteFor,type EnrichChange,type EnrichProfile} from '@/lib/scraper/extract.mjs';

type Result={status:'waiting'|'reading'|'found'|'failed'|'saved';message?:string;site?:string;pages?:string[];profile?:EnrichProfile;changes?:EnrichChange[]};
const MAX_CONTACTS=25;
const labels:Record<string,string>={company:'Company',title:'Job title',email:'Email',phone:'Phone',website:'Website',address:'Address',city:'City',state:'State',zip:'ZIP'};
async function failure(res:Response){try{return (await res.json()).message||'The request failed.';}catch{return 'The request failed.';}}

export function EnrichContacts({ids,onClose}:{ids:string[];onClose:()=>void}){
 const {state,dispatch,busy}=useOperations();
 const contacts=useMemo(()=>ids.map(id=>state.contacts.find(c=>c.id===id)).filter((c):c is Contact=>!!c).slice(0,MAX_CONTACTS),[ids,state.contacts]);
 const [ai,setAi]=useState(false),[aiReady,setAiReady]=useState<boolean|null>(null),[running,setRunning]=useState(false),[saving,setSaving]=useState(false);
 const [results,setResults]=useState<Record<string,Result>>({}),[picked,setPicked]=useState<Record<string,string[]>>({}),[keepExtras,setKeepExtras]=useState(true),[summary,setSummary]=useState('');
 const stop=useRef(false);
 useEffect(()=>{liveFetch('/api/operations/scrape',{cache:'no-store'}).then(res=>res.ok?res.json():null).then(data=>{const ready=!!data?.ai;setAiReady(ready);setAi(ready);}).catch(()=>setAiReady(false));},[]);
 const skip=(c:Contact)=>c.status==='archived'?'Archived — restore first':!websiteFor(c)?'No website or business email to start from':'';
 const update=(id:string,patch:Result)=>setResults(prev=>({...prev,[id]:patch}));

 async function run(){
  stop.current=false;setRunning(true);setSummary('');
  for(const c of contacts){
   if(skip(c)||results[c.id]?.status==='saved')continue;
   if(stop.current){update(c.id,{status:'failed',message:'Stopped'});continue;}
   update(c.id,{status:'reading',site:websiteFor(c)});
   try{
    const res=await liveFetch('/api/operations/enrich',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:c.name,company:c.company,website:c.website||'',email:c.email,ai})});
    if(!res.ok)throw new Error(await failure(res));
    const data=await res.json() as {site:string;pages:string[];profile:EnrichProfile};
    const changes=enrichmentChanges(c as unknown as Record<string,unknown>,data.profile);
    update(c.id,{status:'found',site:data.site,pages:data.pages,profile:data.profile,changes});
    setPicked(prev=>({...prev,[c.id]:changes.filter(x=>x.fill).map(x=>x.key)}));
   }catch(e){update(c.id,{status:'failed',message:e instanceof Error?e.message:'Not read.'});}
  }
  setRunning(false);
 }

 async function apply(){
  setSaving(true);let saved=0,failed=0;
  for(const c of contacts){
   const r=results[c.id];if(r?.status!=='found'||!r.profile)continue;
   const keys=picked[c.id]||[];const extras=keepExtras?enrichmentDetails(r.profile,r.pages||[],new Date().toISOString()):{};
   if(!keys.length&&!keepExtras)continue;
   const patch:Record<string,unknown>=Object.fromEntries(keys.map(k=>[k,r.changes?.find(x=>x.key===k)?.found||'']));
   // contact.save replaces details, so existing entries are kept; the contact limit is 60 entries.
   if(keepExtras)patch.details=Object.fromEntries(Object.entries({...(c.details||{}),...extras}).slice(-60));
   if(!await dispatch({type:'contact.save',id:c.id,patch})){failed++;update(c.id,{...r,status:'failed',message:'Not saved. See the error above; the contact was left unchanged.'});continue;}
   await dispatch({type:'contact.activity',id:c.id,kind:'note',body:`Enriched from ${r.site}${keys.length?`: updated ${keys.map(k=>labels[k].toLowerCase()).join(', ')}`:''}${keepExtras?'. Website findings saved to details.':'.'}`});
   saved++;update(c.id,{...r,status:'saved'});
  }
  setSaving(false);setSummary(`${saved} ${saved===1?'contact':'contacts'} updated${failed?`, ${failed} not saved`:''}.`);
 }
 const found=contacts.filter(c=>results[c.id]?.status==='found');
 const toggle=(id:string,key:string,on:boolean)=>setPicked(prev=>({...prev,[id]:on?[...(prev[id]||[]),key]:(prev[id]||[]).filter(k=>k!==key)}));

 return <Modal title={`Enrich ${contacts.length} ${contacts.length===1?'contact':'contacts'}`} description="Reads each contact’s own website — the home page and up to three contact, about or team pages. Review what was found; only ticked fields are saved." open onClose={()=>{if(!running&&!saving)onClose();}}>
  {ids.length>MAX_CONTACTS&&<p className="ops-warning">Only the first {MAX_CONTACTS} selected contacts are enriched at a time.</p>}
  <label className="lf-toggle"><BrandedInput type="checkbox" checked={ai} disabled={!aiReady||running} onChange={e=>setAi(e.target.checked)}/><span><b>Use AI (Grok)</b><small>{aiReady===null?'Checking…':aiReady?'Finds job titles, descriptions and people on any page layout. Uses xAI API credits.':'Not connected — add LFX_XAI_API_KEY. Without AI, only structured business data, email/phone links and social profiles are found.'}</small></span></label>
  <div className="lf-actions">{running?<Button variant="outline" onClick={()=>{stop.current=true;}}><Square size={16}/> Stop after this contact</Button>:<Button disabled={saving||busy} onClick={()=>void run()}><Play size={16}/> {Object.keys(results).length?'Read again':'Read websites'}</Button>}</div>
  <div className="enrich-list">{contacts.map(c=>{const r=results[c.id];const reason=skip(c);return <article key={c.id} data-status={reason?'skipped':r?.status||'waiting'}>
   <header><b>{c.name}</b><small>{reason||(r?.status==='reading'?`Reading ${r.site}…`:r?.status==='failed'?r.message:r?.status==='saved'?'Saved':r?.status==='found'?`Read ${r.pages?.length} ${r.pages?.length===1?'page':'pages'} from ${r.site?.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,'')}`:websiteFor(c).replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,''))}</small></header>
   {r?.status==='found'&&r.profile&&<>
    {r.changes?.length?<table className="contact-table enrich-table"><thead><tr><th><span className="sr-only">Use</span></th><th>Field</th><th>Now</th><th>Found</th></tr></thead><tbody>{r.changes.map(x=><tr key={x.key}><td><BrandedInput type="checkbox" aria-label={`Use found ${labels[x.key]} for ${c.name}`} checked={(picked[c.id]||[]).includes(x.key)} disabled={saving} onChange={e=>toggle(c.id,x.key,e.target.checked)}/></td><td>{labels[x.key]}</td><td className="ops-muted">{x.current||'—'}</td><td>{x.found}{x.current&&<small className="enrich-replace">replaces current</small>}</td></tr>)}</tbody></table>:<p className="ops-muted">No new field values found.</p>}
    {(r.profile.description||r.profile.services||Object.keys(r.profile.socials).length>0||r.profile.people.length>0)&&<dl className="enrich-extras">
     {r.profile.description&&<><dt>About</dt><dd>{r.profile.description}</dd></>}
     {r.profile.services&&<><dt>Services</dt><dd>{r.profile.services}</dd></>}
     {Object.keys(r.profile.socials).length>0&&<><dt>Profiles</dt><dd>{Object.entries(r.profile.socials).map(([k,v])=><a key={k} href={v} target="_blank" rel="noopener noreferrer nofollow">{k}</a>)}</dd></>}
     {r.profile.people.length>0&&<><dt>People on site</dt><dd>{r.profile.people.map(p=>[p.name,p.title].filter(Boolean).join(', ')).join(' · ')}</dd></>}
    </dl>}
   </>}
  </article>;})}</div>
  {found.length>0&&<>
   <label className="lf-toggle"><BrandedInput type="checkbox" checked={keepExtras} disabled={saving} onChange={e=>setKeepExtras(e.target.checked)}/><span><b>Save website findings to details</b><small>About text, services, social profiles, people named on the site and the pages read.</small></span></label>
   <Button disabled={running||saving||busy} onClick={()=>void apply()}>Save {found.length} reviewed {found.length===1?'contact':'contacts'}</Button>
  </>}
  {summary&&<p role="status" className="ops-muted">{summary}</p>}
  <p className="ops-muted">Found details come from each business’s public website and can be out of date. Verify emails before outreach.</p>
 </Modal>;
}
