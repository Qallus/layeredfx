// Channel Cast Contacts workflow adapted to the existing LayeredFX command boundary.
import {OperationError,uid,validDate} from './engine.mjs';
const fail=(message,status=400)=>{throw new OperationError(message,status);};
const bounded=(v,max=200)=>{if(typeof v!=='string'||v.length>max)fail(`Use text of at most ${max} characters.`);return v.trim();};
export const emailKey=v=>String(v||'').trim().toLowerCase();
export function phoneKey(v){let d=String(v||'').replace(/\D/g,'');if(d.length===11&&d.startsWith('1'))d=d.slice(1);return d;}
export function matchingContacts(contacts,draft,excludeId){const email=emailKey(draft.email),phone=phoneKey(draft.phone);return contacts.filter(c=>c.id!==excludeId&&((email&&emailKey(c.email)===email)||(phone.length>=7&&(phoneKey(c.phone)===phone||phoneKey(c.sms)===phone))));}
function owner(s,id){const p=s.people.find(p=>p.id===id);if(!p||p.role==='viewer')fail('Choose an active owner who can work contacts.');return id;}
const fields={name:200,firstName:100,lastName:100,title:150,company:200,email:254,phone:60,sms:60,source:100,city:100,state:100,address:300,zip:30,website:500,notes:5000};
export function contactPatch(s,p,actor){
 const out={};for(const [key,max]of Object.entries(fields))if(key in p)out[key]=bounded(p[key],max);
 if('name'in out&&!out.name)fail('Contact name is required.');
 if(out.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))fail('Enter a valid email address.');
 if(out.website){try{const u=new URL(out.website);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)fail('Use an HTTP(S) website.');}catch{fail('Use an HTTP(S) website.');}}
 if('type'in p){if(!['contact','lead','prospect','client'].includes(p.type))fail('Invalid contact category.');out.type=p.type;}
 if('status'in p){if(!['active','inactive','archived'].includes(p.status))fail('Invalid contact status.');out.status=p.status;}
 if('owner'in p)out.owner=owner(s,p.owner||actor.id);
 if('lastContact'in p)out.lastContact=validDate(p.lastContact);
 if('tags'in p){if(!Array.isArray(p.tags)||p.tags.length>20)fail('Use at most 20 tags.');out.tags=[...new Set(p.tags.map(t=>bounded(t,50)).filter(Boolean))];}
 if('details'in p){if(!p.details||typeof p.details!=='object'||Array.isArray(p.details)||Object.keys(p.details).length>60)fail('Invalid imported details.');out.details=Object.fromEntries(Object.entries(p.details).map(([k,v])=>[bounded(k,100),bounded(v,1000)]));}
 return out;
}
export function ensureContact(s,draft,actor,now){
 const patch=contactPatch(s,draft,actor);const matches=matchingContacts(s.contacts,patch);
 if(matches.length>1)fail('Email and phone match different contacts. Resolve the conflict before saving.',409);
 if(matches.length)return matches[0];
 if(!patch.name)fail('Contact name is required.');
 const contact={id:uid('contact'),company:'',email:'',phone:'',type:'contact',status:'active',source:'Manual',tags:[],notes:'',...patch,owner:owner(s,patch.owner||actor.id),createdAt:now,updatedAt:now};s.contacts.push(contact);return contact;
}
export function contactCommand(s,c,actor,now){
 const find=id=>s.contacts.find(x=>x.id===id)||fail('Contact not found.',404);
 const active=id=>{const r=find(id);if(r.status==='archived')fail('Restore the contact before making changes.');return r;};
 const log=(contact,kind,body)=>{(s.contactActivities||=[]).push({id:uid('contact_activity'),contactId:contact.id,kind,body,actorId:actor.id,occurredAt:now});};
 const sync=r=>{for(const lead of s.leads.filter(l=>l.contactId===r.id))Object.assign(lead,{name:r.name,company:r.company,email:r.email,phone:r.phone});};
 if(c.type==='contact.save'){
  const patch=contactPatch(s,c.patch||{},actor);
  if(c.id){const r=find(c.id);if(r.status==='archived'&&patch.status!=='active')fail('Restore the contact before editing.');if(matchingContacts(s.contacts,{...r,...patch},r.id).length)fail('Email or phone already belongs to another contact.',409);Object.assign(r,patch,{updatedAt:now});sync(r);if(patch.type==='lead')contactCommand(s,{type:'contact.lead',id:r.id},actor,now);log(r,'updated','Contact details updated.');return r.id;}
  const r=ensureContact(s,patch,actor,now);if(patch.type==='lead')contactCommand(s,{type:'contact.lead',id:r.id},actor,now);log(r,'created','Contact added or existing identity reused.');return r.id;
 }
 if(c.type==='contact.import'){
  if(!Array.isArray(c.rows)||!c.rows.length||c.rows.length>200)fail('Import between 1 and 200 selected contacts at a time.');
  for(const row of c.rows){
   const patch=contactPatch(s,row.draft||{},actor);const matches=matchingContacts(s.contacts,patch);
   if(matches.length>1)fail('An import row matches different contacts. Resolve the conflict first.',409);
   if(row.mergeId){const r=active(row.mergeId);if(matches.length&&matches[0].id!==r.id)fail('Import match changed. Review the file again.',409);
    for(const key of Object.keys(fields))if(key!=='name'&&!r[key]&&patch[key])r[key]=patch[key];
    r.details={...patch.details,...r.details};r.updatedAt=now;sync(r);log(r,'import','Selected phone/file import filled empty fields.');
   }else if(!matches.length){const r=ensureContact(s,patch,actor,now);if(patch.type==='lead')contactCommand(s,{type:'contact.lead',id:r.id},actor,now);log(r,'import','Contact imported from selected phone/file record.');}
  }return 'imported';
 }
 if(c.type==='contact.lead'){
  const r=active(c.id);let lead=s.leads.find(l=>l.contactId===r.id)||s.leads.find(l=>r.email&&emailKey(l.email)===emailKey(r.email));
  if(!lead){lead={id:uid('lead'),contactId:r.id,name:r.name,company:r.company,email:r.email,phone:r.phone,source:r.source||'Contacts',owner:owner(s,r.owner||actor.id),status:'new',opportunityId:null,createdAt:now};s.leads.push(lead);}
  lead.contactId=r.id;if(r.type==='contact')r.type='lead';log(r,'lead','Linked to lead inbox.');return lead.id;
 }
 if(c.type==='contact.linkUser'){
  if(actor.role!=='admin')fail('Only an administrator can link user accounts.',403);const r=active(c.id);
  if(c.userId){if(!s.people.some(p=>p.id===c.userId))fail('Choose an existing active user.');if(s.contacts.some(x=>x.id!==r.id&&x.userId===c.userId))fail('This user is already linked to another contact.',409);}
  r.userId=c.userId||null;log(r,'user','Existing user link updated; account permissions unchanged.');return r.id;
 }
 if(c.type==='contact.activity'){const r=active(c.id);if(!['note','call','sms','email','meeting'].includes(c.kind))fail('Invalid activity type.');const body=bounded(c.body,5000);if(!body)fail('Activity text is required.');log(r,c.kind,body);r.lastContact=now.slice(0,10);return r.id;}
 if(c.type==='contact.delete'){const r=find(c.id);if(s.deals.some(d=>d.contactId===r.id||d.contactIds.includes(r.id))||s.leads.some(l=>l.contactId===r.id)||r.userId||(s.contactActivities||[]).some(a=>a.contactId===r.id&& !['created','updated','import'].includes(a.kind)))fail('This contact has linked history. Archive it instead.');s.contacts=s.contacts.filter(x=>x.id!==r.id);s.contactActivities=(s.contactActivities||[]).filter(x=>x.contactId!==r.id);return r.id;}
 fail('Unsupported contact command.');
}
