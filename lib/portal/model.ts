export const accountTypes=['residential','commercial','contractor','affiliate','vendor'] as const;
export type AccountType=typeof accountTypes[number];
/** Account types that register with a business name and website. */
export const businessAccountTypes:readonly AccountType[]=['commercial','contractor','vendor'];
export type PortalItem={id:string;kind:'booking'|'service'|'product'|'note'|'message'|'referral'|'supply';title:string;body:string;date:string;status:string;author:'account'|'team';createdAt:string};
export type PortalMedia={id:string;name:string;type:string;path:string;size:number};
export type PortalProfile={name:string;company:string;phone:string;address:string;website?:string;socials?:string[]};
export type PortalState={profile:PortalProfile;items:PortalItem[];media:PortalMedia[]};
export type PortalAccount={user_id:string;org_id:string;email:string;kind:AccountType;status:'active'|'pending'|'suspended';revision:number;state:PortalState};
export const isPartner=(kind:string)=>['contractor','affiliate','vendor'].includes(kind);
export const MAX_SOCIAL_LINKS=6;
export function initialPortal(name:string,extra:{company?:string;phone?:string;website?:string;socials?:string[]}={}):PortalState{return{profile:{name,company:extra.company||'',phone:extra.phone||'',address:'',website:extra.website||'',socials:extra.socials||[]},items:[],media:[]};}
export function portalText(value:unknown,max=4000){if(typeof value!=='string'||value.length>max)throw Error('Invalid or oversized text.');return value.trim();}
/** Normalizes a website or social link to an http(s) URL; empty input stays empty. */
export function portalUrl(value:unknown){
 const raw=portalText(value??'',300);if(!raw)return '';
 try{const url=new URL(/^https?:\/\//i.test(raw)?raw:`https://${raw}`);if(!['http:','https:'].includes(url.protocol)||!url.hostname.includes('.'))throw Error();return url.href;}
 catch{throw Error('Enter a valid website or social media link.');}
}
export function portalCommand(account:PortalAccount,command:Record<string,unknown>,staff=false):PortalAccount{
 const next=structuredClone(account);const state=next.state;
 if(command.type==='approval'){
  if(!staff||!['active','suspended'].includes(String(command.status)))throw Error('Administrator approval required.');
  next.status=command.status as PortalAccount['status'];
 }else{
  if(account.status==='suspended'||(account.status==='pending'&&command.type!=='profile'))throw Error('Your partner account is awaiting approval.');
  if(command.type==='profile'){
   const p=command.profile as Record<string,unknown>;if(!p)throw Error('Profile is required.');
   const previous=state.profile;
   state.profile={name:portalText(p.name,150),company:portalText(p.company??'',200),phone:portalText(p.phone??'',40),address:portalText(p.address??'',500),
    website:p.website===undefined?previous.website||'':portalUrl(p.website),
    socials:p.socials===undefined?previous.socials||[]:(Array.isArray(p.socials)?p.socials:[]).slice(0,MAX_SOCIAL_LINKS).map(portalUrl).filter(Boolean)};
   if(!state.profile.name)throw Error('Your name is required.');
  }else if(command.type==='item'){
   if(state.items.length>=1000)throw Error('Account record limit reached. Contact the team.');
   const kind=String(command.kind) as PortalItem['kind'];
   if(!['booking','service','product','note','message','referral','supply'].includes(kind)||staff&&kind!=='message')throw Error('Invalid request type.');
   if(['referral','supply'].includes(kind)&&!isPartner(account.kind))throw Error('Partner access required.');
   const title=portalText(command.title,180),body=portalText(command.body),date=portalText(command.date||'',16);
   if(!title||!body)throw Error('Title and details are required.');
   if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))throw Error('Choose a valid date.');
   state.items.push({id:crypto.randomUUID(),kind,title,body,date,status:['note','message'].includes(kind)?'saved':'requested',author:staff?'team':'account',createdAt:new Date().toISOString()});
  }else if(command.type==='status'){
   const item=state.items.find(i=>i.id===command.id);if(!item)throw Error('Request not found.');
   if(!staff){if(command.status!=='cancelled'||item.status!=='requested'||['note','message'].includes(item.kind))throw Error('This request cannot be cancelled.');}
   else if(!['confirmed','declined','completed'].includes(String(command.status))||['note','message'].includes(item.kind))throw Error('Invalid request status.');
   item.status=String(command.status);
  }else throw Error('Unsupported portal action.');
 }
 next.revision++;return next;
}
/** User management role for each portal account type (customers vs. partner roles). */
export const portalUserRole:Record<AccountType,'customer'|'reseller'|'referral'|'vendor'>={residential:'customer',commercial:'customer',contractor:'reseller',affiliate:'referral',vendor:'vendor'};
/** Maps a portal account (from /api/portal/staff) to a row in the dashboard's user management list. */
export function portalAdminUser(account:Pick<PortalAccount,'user_id'|'email'|'kind'|'status'|'state'>&{updated_at?:string}){
 const profile=account.state?.profile;
 return {id:account.user_id,email:account.email,full_name:profile?.name||account.email,phone:profile?.phone||null,company:profile?.company||null,role:portalUserRole[account.kind]??'customer',status:account.status,created_at:account.updated_at||'',last_login_at:null,deleted_at:null,portal_kind:account.kind};
}
export const portalCatalog=[
 {name:'Architectural surface films',description:'Explore finishes for cabinets, counters and appliances.',kind:'product'},
 {name:'Wallpaper & wall finishes',description:'Find a new texture, pattern or material for your space.',kind:'product'},
 {name:'Window films',description:'Discuss privacy and decorative film options.',kind:'product'},
 {name:'Installation',description:'Request installation planning for your selected finish.',kind:'service'},
 {name:'Site consultation',description:'Review surfaces, measurements and project requirements.',kind:'service'},
 {name:'Painting & specialty finishes',description:'Explore painting, Roman clay and faux concrete finishes.',kind:'service'},
] as const;
