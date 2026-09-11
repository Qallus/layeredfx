"use client";
// Channel Cast's mobile bottom navigation hide/restore pattern, adapted for LayeredFX.
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LayoutDashboard,Phone,MessageSquare,Contact,UserPlus,ChartNoAxesCombined,BriefcaseBusiness,IdCard,Camera,Mic,ChevronDown,ChevronUp} from 'lucide-react';
import {openQuickTool} from './quick-events';
import {useOperations} from './provider';
import {Button,Field,Modal} from './shared';
import {brand} from '@/lib/brand';
import Image from 'next/image';

const items=[
 {label:'Dashboard',icon:LayoutDashboard,href:'/admin'},
 {label:'Call',icon:Phone,action:'dialpad'},
 {label:'SMS',icon:MessageSquare,action:'sms'},
 {label:'Contacts',icon:Contact,href:'/admin/contacts'},
 {label:'Leads',icon:UserPlus,action:'leads'},
 {label:'Pipeline',icon:ChartNoAxesCombined,href:'/admin/pipeline'},
 {label:'Jobs',icon:BriefcaseBusiness,href:'/admin/jobs'},
 {label:'Digital Business Card',icon:IdCard,action:'card'},
 {label:'Camera',icon:Camera,action:'camera'},
 {label:'Record',icon:Mic,action:'record'},
] as const;
export function MobileBottomNav(){
 const path=usePathname();const[hidden,setHidden]=useState(false),[panel,setPanel]=useState('');
 useEffect(()=>{setHidden(localStorage.getItem('lfx:bottom-nav:hidden')==='true');},[]);
 function toggle(next:boolean){setHidden(next);localStorage.setItem('lfx:bottom-nav:hidden',String(next));}
 useEffect(()=>{if(panel)window.dispatchEvent(new Event('lfx:close-quick-tool'));},[panel]);
 return <><div className={`ops-mobile-dock ${hidden?'is-hidden':''}`}>
 <button className="ops-dock-handle" aria-label={hidden?'Show bottom menu':'Hide bottom menu'} aria-expanded={!hidden} aria-controls="mobile-shortcuts" onClick={()=>toggle(!hidden)}>{hidden?<ChevronUp size={14}/>:<ChevronDown size={14}/>} {hidden?'Menu':'Hide'}</button>
 <nav id="mobile-shortcuts" aria-label="Mobile shortcuts" hidden={hidden}><div className="ops-dock-scroll">{items.map(item=>{const Icon=item.icon;const content=<><Icon size={21}/><span>{item.label}</span></>;return 'href' in item?<Link key={item.label} href={item.href} aria-label={item.label} aria-current={(item.href==='/admin'?path===item.href:path.startsWith(item.href))?'page':undefined}>{content}</Link>:<button key={item.label} aria-label={item.label} onClick={()=>{if(item.action==='dialpad'||item.action==='sms'||item.action==='record'){setPanel('');openQuickTool(item.action);}else setPanel(item.action);}}>{content}</button>;})}</div></nav>
 </div>
 <Modal open={panel==='leads'} onClose={()=>setPanel('')} title="Leads" description="Review leads and open the lead workspace."><MobileLeads onClose={()=>setPanel('')}/></Modal>
 <Modal open={panel==='card'} onClose={()=>setPanel('')} title="Digital Business Card" description="Create a contact card to download or share. Saved on this browser.">{panel==='card'&&<BusinessCard/>}</Modal>
 <Modal open={panel==='camera'} onClose={()=>setPanel('')} title="Camera" description="Capture a photo or video. Media stays on this device unless you download or share it.">{panel==='camera'&&<CameraCapture/>}</Modal>
 </>;
}
function MobileLeads({onClose}:{onClose:()=>void}){
 const{state}=useOperations();const[query,setQuery]=useState('');
 const leads=state.leads.filter(l=>`${l.name} ${l.company} ${l.email}`.toLowerCase().includes(query.toLowerCase()));
 return <><Field label="Search leads"><input value={query} onChange={e=>setQuery(e.target.value)}/></Field><div className="ops-mobile-leads">{leads.map(l=><article key={l.id}><b>{l.name}</b><small>{l.company} · {l.status}</small>{l.phone&&<Button variant="outline" onClick={()=>{onClose();openQuickTool('dialpad',{phone:l.phone});}}>Call {l.name}</Button>}{l.opportunityId&&<Link href={`/admin/pipeline/${l.opportunityId}`} onClick={onClose}>Open opportunity</Link>}</article>)}{!leads.length&&<p>No matching leads.</p>}</div><Button asChild><Link href="/admin/leads" onClick={onClose}>Manage / add leads</Link></Button></>;
}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function BusinessCard(){
 const{actor}=useOperations();const[draft,setDraft]=useState({name:actor.name,email:actor.email||'',phone:'',title:'',company:'LayeredFX',website:''});const[message,setMessage]=useState('');
 const key=`lfx:business-card:${actor.id}`;
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&typeof saved==='object')setDraft(d=>Object.fromEntries(Object.entries(d).map(([k,v])=>[k,typeof saved[k]==='string'?saved[k]:v])) as typeof d);}catch{setMessage('Could not load the saved card.');}},[key]);
 const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 function card(){return new File([['BEGIN:VCARD','VERSION:3.0',`FN:${escape(draft.name)}`,`ORG:${escape(draft.company)}`,`TITLE:${escape(draft.title)}`,`EMAIL:${escape(draft.email)}`,`TEL:${escape(draft.phone)}`,`URL:${escape(draft.website)}`,'END:VCARD',''].join('\r\n')],'layeredfx-contact.vcf',{type:'text/vcard'});}
 return <div className="ops-card-editor"><div className="ops-business-card"><Image src={brand.dashboard.light} width={200} height={28} alt="LayeredFX"/><h2>{draft.name||'Your name'}</h2><p>{draft.title} {draft.company&&`· ${draft.company}`}</p><p>{draft.email}</p><p>{draft.phone}</p><p>{draft.website}</p></div>{Object.entries(draft).map(([key,value])=><Field label={key[0].toUpperCase()+key.slice(1)} key={key}><input maxLength={200} type={key==='email'?'email':key==='phone'?'tel':'text'} value={value} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></Field>)}<div className="ops-actions"><Button disabled={!draft.name.trim()} onClick={()=>{try{localStorage.setItem(key,JSON.stringify(draft));setMessage('Card saved on this browser.');}catch{setMessage('Storage is unavailable. You can still download the card.');}}}>Save card</Button><Button variant="outline" disabled={!draft.name.trim()} onClick={()=>download(card(),'layeredfx-contact.vcf')}>Download contact card</Button><Button variant="outline" disabled={!draft.name.trim()} onClick={async()=>{try{const file=card();if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:draft.name});else{download(file,file.name);setMessage('Contact card downloaded. Share the file from your device.');}}catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setMessage('Sharing failed. You can download the card instead.');}}}>Share card</Button></div>{message&&<p role="status">{message}</p>}</div>;
}
function CameraCapture(){
 const photo=useRef<HTMLInputElement>(null),video=useRef<HTMLInputElement>(null);const[file,setFile]=useState<File|null>(null),[url,setUrl]=useState(''),[error,setError]=useState('');
 useEffect(()=>{if(!file){setUrl('');return;}const next=URL.createObjectURL(file);setUrl(next);return()=>URL.revokeObjectURL(next);},[file]);
 function select(file?:File){if(!file)return;if(!/^(image|video)\//.test(file.type)){setError('Choose a photo or video.');return;}if(file.size>100_000_000){setError('Choose media smaller than 100 MB.');return;}setError('');setFile(file);}
 return <div className="ops-camera"><p>Your phone controls the camera picker. On devices without camera capture support, choose a photo or video file.</p><input ref={photo} hidden type="file" accept="image/*" capture="environment" onChange={e=>{select(e.target.files?.[0]);e.target.value='';}}/><input ref={video} hidden type="file" accept="video/*" capture="environment" onChange={e=>{select(e.target.files?.[0]);e.target.value='';}}/><div className="ops-actions"><Button onClick={()=>photo.current?.click()}>Take photo</Button><Button variant="outline" onClick={()=>video.current?.click()}>Record video</Button></div>{error&&<p role="alert">{error}</p>}{file&&url&&<>{file.type.startsWith('video/')?<video src={url} controls playsInline/>:<img src={url} alt="Captured photo preview"/>}<p>{file.name}</p><a href={url} download={file.name}>Download capture</a><Button variant="outline" onClick={()=>setFile(null)}>Clear capture</Button></>}</div>;
}
