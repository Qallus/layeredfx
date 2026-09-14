'use client';
import {useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {Layers,Trees,Droplets,Gem,PanelsTopLeft,Search,Check,X} from 'lucide-react';
function FamilyIcon({name}:{name:string}){const Icon=/wood/i.test(name)?Trees:/wetwall/i.test(name)?Droplets:/quartz|solid/i.test(name)?Gem:/panel|thinscape/i.test(name)?PanelsTopLeft:Layers;return <Icon size={18} aria-hidden="true"/>;}
export function MaterialFamilyPicker({value,families,onChange}:{value:string;families:string[];onChange:(value:string)=>void}){
 const [open,setOpen]=useState(false),[search,setSearch]=useState('');
 const options=['',...families].filter(f=>(f||'All libraries').toLowerCase().includes(search.toLowerCase()));
 return <Dialog.Root open={open} onOpenChange={v=>{setOpen(v);if(v)setSearch('');}}><div className="ws-family-field"><span>Wilsonart library</span><Dialog.Trigger className="ws-family-trigger" aria-label="Choose Wilsonart library"><FamilyIcon name={value}/><span>{value.replace(' (HPL)','')||'All libraries'}</span><Search size={16}/></Dialog.Trigger></div><Dialog.Portal><Dialog.Overlay className="ws-family-overlay"/><Dialog.Content className="ws-family-dialog"><Dialog.Title>Material libraries</Dialog.Title><Dialog.Description>Search and choose a material type.</Dialog.Description><Dialog.Close className="ws-family-close" aria-label="Close library picker"><X size={18}/></Dialog.Close><label className="ws-family-search"><Search size={18}/><input aria-label="Search material libraries" placeholder="Search libraries..." value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="ws-family-options">{options.map(f=><button key={f} aria-pressed={value===f} onClick={()=>{onChange(f);setOpen(false);}}><FamilyIcon name={f}/><span>{f.replace(' (HPL)','')||'All libraries'}</span>{value===f&&<Check size={16}/>}</button>)}{!options.length&&<p>No libraries found.</p>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
