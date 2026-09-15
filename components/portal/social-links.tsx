"use client";
// Repeatable social media link inputs, submitted as multiple values under one field name.
import {useState} from 'react';
import {Plus,X} from 'lucide-react';
import {MAX_SOCIAL_LINKS} from '@/lib/portal/model';

export function SocialLinks({name='socials',initial=[]}:{name?:string;initial?:string[]}){
 const[links,setLinks]=useState<string[]>(initial.length?initial:['']);
 return <fieldset className="portal-socials">
  <legend>Social media <span className="portal-optional">(optional)</span></legend>
  {links.map((link,index)=><div className="portal-social-row" key={index}>
   <input name={name} value={link} onChange={e=>setLinks(current=>current.map((value,i)=>i===index?e.target.value:value))} placeholder="instagram.com/yourname" inputMode="url" autoComplete="url" maxLength={300} aria-label={`Social media link ${index+1}`}/>
   {links.length>1&&<button type="button" className="portal-icon-button" aria-label={`Remove social media link ${index+1}`} onClick={()=>setLinks(current=>current.filter((_,i)=>i!==index))}><X size={16}/></button>}
  </div>)}
  {links.length<MAX_SOCIAL_LINKS&&<button type="button" className="portal-text-button portal-add-link" onClick={()=>setLinks(current=>[...current,''])}><Plus size={15}/>Add another link</button>}
 </fieldset>;
}
