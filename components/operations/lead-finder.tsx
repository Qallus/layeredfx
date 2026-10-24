"use client";
// Lead Finder: reads public pages through /api/operations/scrape, then imports only the reviewed, selected rows
// with the same duplicate checks and contact.import command as the Contacts importer.
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {Download,Play,Square,Trash2} from 'lucide-react';
import {liveFetch,useOperations} from './provider';
import {Button,Field,PageTitle,Panel} from './shared';
import {BrandedInput,BrandedSelect} from './branded-fields';
import type {Contact} from '@/lib/operations/types';
import {contactsCsv,reviewCandidates,type Candidate,type Draft} from '@/lib/contacts/import';
import './lead-finder.css';

type PageRun={url:string;status:'waiting'|'reading'|'done'|'failed';title?:string;found?:number;message?:string};
const MAX_PAGES=25;
const categories:Record<string,string>={lead:'Lead',prospect:'Potential customer',contact:'Contact'};
const DEFAULT_PROMPT='Every business or person listed on this page, with their name, company, email, phone, website and city.';
async function failure(res:Response){try{return (await res.json()).message||'The request failed.';}catch{return 'The request failed.';}}
function download(content:string){const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='layeredfx-lead-finder.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export function LeadFinderPage(){
 const {state,actor,dispatch,busy}=useOperations();const readonly=actor.role==='viewer';
 const [urls,setUrls]=useState(''),[instructions,setInstructions]=useState(DEFAULT_PROMPT),[ai,setAi]=useState(false),[aiReady,setAiReady]=useState<boolean|null>(null);
 const [runs,setRuns]=useState<PageRun[]>([]),[running,setRunning]=useState(false);const stop=useRef(false);
 const [drafts,setDrafts]=useState<Draft[]>([]),[selected,setSelected]=useState<number[]>([]),[type,setType]=useState('lead'),[tags,setTags]=useState('lead-finder');
 const [error,setError]=useState(''),[progress,setProgress]=useState(''),[importing,setImporting]=useState(false),[imported,setImported]=useState<number[]>([]);
 useEffect(()=>{liveFetch('/api/operations/scrape',{cache:'no-store'}).then(res=>res.ok?res.json():null).then(data=>{const ready=!!data?.ai;setAiReady(ready);setAi(ready);}).catch(()=>setAiReady(false));},[]);
 const candidates=useMemo(()=>reviewCandidates(drafts,state.contacts),[drafts,state.contacts]);
 // Matching is by email/phone, so rows already imported from this run are tracked here too.
 const blocked=(c:Candidate)=>c.conflict||c.batchDuplicate||!!c.match||imported.includes(c.key);
 const list=()=>[...new Set(urls.split(/\s+/).map(u=>u.trim()).filter(Boolean).map(u=>/^https?:\/\//i.test(u)?u:`https://${u}`))];

 async function run(){
  const targets=list();setError('');setProgress('');
  if(!targets.length)return setError('Add at least one web address.');
  if(targets.length>MAX_PAGES)return setError(`Read at most ${MAX_PAGES} pages at a time.`);
  stop.current=false;setRunning(true);let all=drafts;setRuns(targets.map(url=>({url,status:'waiting'})));
  const update=(i:number,patch:Partial<PageRun>)=>setRuns(prev=>prev.map((r,j)=>j===i?{...r,...patch}:r));
  for(let i=0;i<targets.length;i++){
   if(stop.current){update(i,{status:'failed',message:'Stopped'});continue;}
   update(i,{status:'reading'});
   try{
    const res=await liveFetch('/api/operations/scrape',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:targets[i],instructions,ai})});
    if(!res.ok)throw new Error(await failure(res));
    const data=await res.json() as {title:string;leads:Draft[]};
    const fresh=data.leads.map(l=>({...l,type:'lead',status:'active',tags:[]}) as Draft);
    const start=all.length;all=[...all,...fresh];setDrafts(all);
    const added=reviewCandidates(all,state.contacts).slice(start).filter(c=>!blocked(c)).map(c=>c.key);setSelected(sel=>[...sel,...added]);
    update(i,{status:'done',title:data.title,found:fresh.length});
   }catch(e){update(i,{status:'failed',message:e instanceof Error?e.message:'Not read.'});}
  }
  setRunning(false);
 }

 async function importSelected(){
  setImporting(true);setError('');const rows=candidates.filter(c=>selected.includes(c.key)&&!blocked(c));const tagList=tags.split(',').map(t=>t.trim()).filter(Boolean).slice(0,20);let done=0;
  try{while(done<rows.length){const batch=rows.slice(done,done+100);setProgress(`Saving ${done+1}–${done+batch.length} of ${rows.length}…`);
   if(!await dispatch({type:'contact.import',rows:batch.map(c=>({draft:{...c.draft,type,owner:actor.id,tags:tagList}}))})){setProgress(`Import stopped after ${done} rows. The rest are still selected; review the error before retrying.`);return;}
   done+=batch.length;setSelected(prev=>prev.filter(k=>!batch.some(c=>c.key===k)));setImported(prev=>[...prev,...batch.map(c=>c.key)]);
  }setProgress(`${done} ${done===1?'record':'records'} imported as ${categories[type].toLowerCase()}s.`);}
  catch(e){setError(e instanceof Error?e.message:'Import failed.');}finally{setImporting(false);}
 }
 const clear=()=>{setDrafts([]);setSelected([]);setImported([]);setRuns([]);setProgress('');};
 const status=(c:Candidate)=>imported.includes(c.key)?'Imported':c.conflict?'Matches more than one contact — skipped':c.batchDuplicate?'Duplicate in these results — skipped':c.match?`Already in contacts: ${c.match.name}`:'New';

 return <>
 <PageTitle title="Lead Finder" description="Read public web pages, pull out businesses and contact details, review them, then add the ones you want as leads."/>
 <p className="ops-muted lf-notice">Only public pages are read, and sites that disallow automated tools in robots.txt are skipped. Check each site’s terms before scraping it, and verify emails before outreach — CAN-SPAM (and GDPR/CASL for EU or Canadian contacts) applies.</p>
 <Panel title="Pages to read">
  <div className="lf-form">
   <Field label={`Web addresses (one per line, up to ${MAX_PAGES})`}><textarea value={urls} onChange={e=>setUrls(e.target.value)} rows={5} placeholder={'https://example-directory.com/contractors?page=1\nhttps://example-directory.com/contractors?page=2'} disabled={running}/></Field>
   <Field label="What to extract"><textarea value={instructions} onChange={e=>setInstructions(e.target.value)} rows={3} maxLength={1000} disabled={running||!ai}/></Field>
   <label className="lf-toggle"><BrandedInput type="checkbox" checked={ai} disabled={!aiReady||running} onChange={e=>setAi(e.target.checked)}/><span><b>Use AI extraction (Grok)</b><small>{aiReady===null?'Checking…':aiReady?'Reads any page layout using your instructions. Uses xAI API credits.':'Not connected — add LFX_XAI_API_KEY. Without AI, only structured business data and email/phone links on each page are found.'}</small></span></label>
   <div className="lf-actions">{running?<Button variant="outline" onClick={()=>{stop.current=true;}}><Square size={16}/> Stop after this page</Button>:<Button disabled={readonly||!urls.trim()} onClick={()=>void run()}><Play size={16}/> Read pages</Button>}{!!drafts.length&&!running&&<Button variant="outline" onClick={clear}><Trash2 size={16}/> Clear results</Button>}</div>
   {error&&<p role="alert" className="ops-error">{error}</p>}
  </div>
  {!!runs.length&&<ul className="lf-runs">{runs.map((r,i)=><li key={i} data-status={r.status}><span className="lf-run-url">{r.title||r.url}</span><small>{r.status==='done'?`${r.found} found`:r.status==='reading'?'Reading…':r.status==='waiting'?'Waiting':r.message}</small></li>)}</ul>}
 </Panel>
 {!!drafts.length&&<Panel title={`Results (${candidates.length})`} action={<Button size="sm" variant="outline" onClick={()=>download(contactsCsv(drafts.map((d,i)=>({...d,id:`lf-${i}`,type:'lead'}) as Contact)))}><Download size={16}/> Export CSV</Button>}>
  <div className="lf-import">
   <Field label="Add as"><BrandedSelect value={type} onChange={e=>setType(e.target.value)}>{Object.entries(categories).map(([id,label])=><option key={id} value={id}>{label}</option>)}</BrandedSelect></Field>
   <Field label="Tags (comma separated)"><BrandedInput value={tags} onChange={e=>setTags(e.target.value)}/></Field>
   <Button variant="outline" disabled={importing} onClick={()=>setSelected(candidates.filter(c=>!blocked(c)).map(c=>c.key))}>Select all new</Button>
   <Button variant="outline" disabled={importing} onClick={()=>setSelected([])}>Deselect all</Button>
   <Button disabled={readonly||busy||importing||running||!selected.length} onClick={()=>void importSelected()}>Import {selected.length} selected</Button>
  </div>
  {progress&&<p role="status" className="ops-muted">{progress} {progress.includes('imported')&&<Link href={type==='lead'?'/admin/leads':'/admin/contacts'}>Open {type==='lead'?'Leads':'Contacts'}</Link>}</p>}
  <div className="contact-table-wrap"><table className="contact-table lf-table"><thead><tr><th><span className="sr-only">Select</span></th>{['Name','Company','Email','Phone','Website','Location','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{candidates.map(c=><tr key={c.key} className={blocked(c)?'is-blocked':''} title={c.draft.notes||undefined}>
   <td><BrandedInput type="checkbox" aria-label={`Select ${c.draft.name}`} disabled={blocked(c)||importing} checked={selected.includes(c.key)} onChange={e=>setSelected(prev=>e.target.checked?[...prev,c.key]:prev.filter(k=>k!==c.key))}/></td>
   <td>{c.draft.name}</td><td>{c.draft.company}</td><td>{c.draft.email}</td><td>{c.draft.phone}</td>
   <td>{c.draft.website&&<a href={c.draft.website} target="_blank" rel="noopener noreferrer nofollow">{c.draft.website.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,'').slice(0,40)}</a>}</td>
   <td>{[c.draft.city,c.draft.state].filter(Boolean).join(', ')}</td><td><small>{status(c)}</small></td></tr>)}</tbody></table></div>
 </Panel>}
 </>;
}
