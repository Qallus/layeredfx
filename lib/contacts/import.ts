import {parseVCards,fromPicked,type ContactPickerResult} from '@/lib/channelcast/phone-import';
import type {Contact} from '@/lib/operations/types';
import {matchingContacts} from '@/lib/operations/contacts.mjs';
export type Draft=Partial<Contact>&{name:string;email:string;phone:string;company:string};
export type Candidate={key:number;draft:Draft;match?:Contact;conflict:boolean;batchDuplicate:boolean};
export function pickedDraft(picked:ContactPickerResult):Draft{return sanitizeDraft(fromPicked(picked));}
export function sanitizeDraft(value:Partial<Contact>):Draft{
 const fields=['name','firstName','lastName','title','company','email','phone','sms','source','city','state','address','zip','website','notes'] as const;
 const out:Record<string,string>={};for(const key of fields)if(typeof value[key]==='string')out[key]=value[key] as string;
 return {name:out.name||out.email||out.phone||'',email:'',phone:'',company:'',...out,type:'contact',status:'active',source:out.source||'Import',tags:[],details:value.details||{}};
}
export function csvRows(text:string):string[][]{
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(!quoted&&(ch===','||ch==='\n'||ch==='\r')){row.push(field);field='';if(ch!==','){if(ch==='\r'&&text[i+1]==='\n')i++;if(row.some(Boolean))rows.push(row);row=[];}}else field+=ch;}
 if(quoted)throw new Error('CSV has an unclosed quoted field.');row.push(field);if(row.some(Boolean))rows.push(row);return rows;
}
export function parseContactFile(text:string,filename:string):Draft[]{
 if(new TextEncoder().encode(text).length>2_000_000)throw new Error('Choose a contact file smaller than 2 MB.');
 if(/\.vcf$/i.test(filename)||/^\s*BEGIN:VCARD/i.test(text))return parseVCards(text).map(sanitizeDraft);
 const rows=csvRows(text.replace(/^\uFEFF/,''));const headers=(rows.shift()||[]).map(h=>h.trim().toLowerCase());
 const aliases:Record<string,string[]>={name:['name','full name','display name'],firstName:['first name','given name'],lastName:['last name','family name'],email:['email','e-mail 1 - value','email address'],phone:['phone','phone 1 - value','mobile'],company:['company','organization 1 - name'],title:['title','job title'],city:['city'],state:['state'],address:['address'],zip:['zip','postal code'],website:['website'],notes:['notes'],source:['source']};
 if(!headers.some(h=>Object.values(aliases).flat().includes(h)))throw new Error('CSV needs Name, Email or Phone headers. Google Contacts CSV is supported.');
 return rows.map(values=>{const draft:Record<string,string>={};for(const [key,names]of Object.entries(aliases)){const i=headers.findIndex(h=>names.includes(h));if(i>=0)draft[key]=values[i]||'';}draft.name||=[draft.firstName,draft.lastName].filter(Boolean).join(' ')||draft.email||draft.phone||'';return sanitizeDraft(draft);}).filter(d=>d.name);
}
export function reviewCandidates(drafts:Draft[],existing:Contact[]):Candidate[]{
 const prior:Contact[]=[];return drafts.map((draft,key)=>{const hits=matchingContacts(existing,draft);const batchDuplicate=matchingContacts(prior,draft).length>0;prior.push({...draft,id:`import-${key}`,type:'contact'});return {key,draft,match:hits[0],conflict:hits.length>1,batchDuplicate};});
}
export function contactsCsv(contacts:Contact[]):string{
 const fields=['name','email','phone','company','title','city','state','source','notes'] as const;
 const escape=(v:string)=>`"${(/^[=+@\-\t\r]/.test(v)?"'":'')+v.replaceAll('"','""')}"`;
 return [fields.join(','),...contacts.map(c=>fields.map(f=>escape(c[f]||'')).join(','))].join('\r\n');
}
