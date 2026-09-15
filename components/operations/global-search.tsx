"use client";
// Topbar search. It only looks through the operations state already delivered to this member, which the server
// filters by record access, so it never reveals documents or plans the member cannot open.
import {useEffect,useMemo,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {Search} from 'lucide-react';
import {dashboardNavigation} from '@/lib/dashboard/navigation';
import {useOperations} from './provider';

type Result={id:string;label:string;sub:string;href:string};
type Group={name:string;results:Result[]};
const PER_GROUP=5;

export function GlobalSearch(){
 const {state}=useOperations();const router=useRouter();
 const [query,setQuery]=useState('');const [open,setOpen]=useState(false);const [active,setActive]=useState(0);
 const input=useRef<HTMLInputElement>(null);const box=useRef<HTMLDivElement>(null);
 // ⌘K / Ctrl+K focuses the search from anywhere in the dashboard.
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.current?.focus();input.current?.select();setOpen(true);}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[]);
 useEffect(()=>{const onDown=(e:MouseEvent)=>{if(!box.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('mousedown',onDown);return()=>document.removeEventListener('mousedown',onDown);},[]);

 const groups=useMemo<Group[]>(()=>{
  const term=query.trim().toLowerCase();if(!term)return [];
  const match=(...fields:unknown[])=>fields.some(f=>String(f??'').toLowerCase().includes(term));
  const pages=dashboardNavigation.flatMap(g=>g.items.flatMap(i=>[i,...(i.children||[])])).filter(i=>!i.soon&&match(i.label)).map(i=>({id:`page:${i.href}`,label:i.label,sub:'Dashboard page',href:i.href}));
  const deals=state.deals.filter(d=>match(d.name,d.client,d.source)).map(d=>({id:`deal:${d.id}`,label:d.name,sub:[d.client,d.archivedAt?'Archived':''].filter(Boolean).join(' · '),href:`/admin/pipeline/${d.id}`}));
  const contacts=state.contacts.filter(c=>match(c.name,c.email,c.phone,c.company)).map(c=>({id:`contact:${c.id}`,label:c.name,sub:[c.email,c.phone,c.company].filter(Boolean).join(' · '),href:'/admin/contacts'}));
  const leads=state.leads.filter(l=>match(l.name,l.email,l.company)).map(l=>({id:`lead:${l.id}`,label:l.name,sub:[l.email,l.company,l.status].filter(Boolean).join(' · '),href:l.opportunityId?`/admin/pipeline/${l.opportunityId}`:'/admin/leads'}));
  const documents=state.documents.filter(d=>!d.archived_at&&match(d.title)).map(d=>({id:`doc:${d.id}`,label:d.title,sub:'Workspace document',href:`/admin/workspace/${d.id}`}));
  const plans=state.plans.filter(p=>!p.archived_at&&match(p.name)).map(p=>({id:`plan:${p.id}`,label:p.name,sub:'Plan',href:`/admin/plans/${p.id}`}));
  const team=(state.team||[]).filter(m=>match(m.name,m.title,m.department,m.company,m.email)).map(m=>({id:`team:${m.id}`,label:m.name,sub:[m.title,m.company].filter(Boolean).join(' · ')||((m.group||'team')==='team'?'LFX Team':'Partner'),href:(m.group||'team')==='team'?'/admin/team':'/admin/partners'}));
  return [{name:'Opportunities',results:deals},{name:'Contacts',results:contacts},{name:'Leads',results:leads},{name:'Documents',results:documents},{name:'Plans',results:plans},{name:'Team & partners',results:team},{name:'Pages',results:pages}]
   .map(g=>({...g,results:g.results.slice(0,PER_GROUP)})).filter(g=>g.results.length);
 },[query,state]);
 const flat=groups.flatMap(g=>g.results);

 function go(result:Result){setOpen(false);setQuery('');router.push(result.href);}
 function onKeyDown(e:React.KeyboardEvent<HTMLInputElement>){
  if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);setActive(i=>Math.min(i+1,Math.max(flat.length-1,0)));}
  else if(e.key==='ArrowUp'){e.preventDefault();setActive(i=>Math.max(i-1,0));}
  else if(e.key==='Enter'&&flat[active]){e.preventDefault();go(flat[active]);}
  else if(e.key==='Escape'){setOpen(false);input.current?.blur();}
 }
 const showing=open&&Boolean(query.trim());let index=-1;
 return <div className="ops-search-box" ref={box}>
  <Search size={16} aria-hidden/>
  <input ref={input} type="search" role="combobox" aria-label="Search the dashboard" aria-expanded={showing} aria-controls="ops-search-results" aria-autocomplete="list" aria-activedescendant={showing&&flat[active]?`ops-search-option-${active}`:undefined} placeholder="Search contacts, opportunities, documents…" value={query} onChange={e=>{setQuery(e.target.value);setActive(0);setOpen(true);}} onFocus={()=>setOpen(true)} onKeyDown={onKeyDown}/>
  <kbd aria-hidden>⌘K</kbd>
  {showing&&<div id="ops-search-results" className="ops-search-results" role="listbox" aria-label="Search results">
   {groups.map(group=><div key={group.name} role="group" aria-label={group.name}>
    <p className="ops-search-group" aria-hidden>{group.name}</p>
    {group.results.map(result=>{index++;const i=index;return <div key={result.id} id={`ops-search-option-${i}`} role="option" aria-selected={i===active} className={`ops-search-option${i===active?' active':''}`} onMouseEnter={()=>setActive(i)} onMouseDown={e=>e.preventDefault()} onClick={()=>go(result)}><b>{result.label}</b>{result.sub&&<small>{result.sub}</small>}</div>;})}
   </div>)}
   {!flat.length&&<p className="ops-search-empty">No matches for “{query.trim()}”.</p>}
  </div>}
 </div>;
}
