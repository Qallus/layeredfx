export const accountTypes=['residential','commercial','contractor','affiliate','vendor'] as const;
export type AccountType=typeof accountTypes[number];
export type PortalItem={id:string;kind:'booking'|'service'|'product'|'note'|'message'|'referral'|'supply';title:string;body:string;date:string;status:string;author:'account'|'team';createdAt:string};
export type PortalMedia={id:string;name:string;type:string;path:string;size:number};
export type PortalState={profile:{name:string;company:string;phone:string;address:string};items:PortalItem[];media:PortalMedia[]};
export type PortalAccount={user_id:string;org_id:string;email:string;kind:AccountType;status:'active'|'pending'|'suspended';revision:number;state:PortalState};
export const isPartner=(kind:string)=>['contractor','affiliate','vendor'].includes(kind);
export function initialPortal(name:string):PortalState{return{profile:{name,company:'',phone:'',address:''},items:[],media:[]};}
export function portalText(value:unknown,max=4000){if(typeof value!=='string'||value.length>max)throw Error('Invalid or oversized text.');return value.trim();}
export function portalCommand(account:PortalAccount,command:Record<string,unknown>,staff=false):PortalAccount{
 const next=structuredClone(account);const state=next.state;
 if(command.type==='approval'){
  if(!staff||!['active','suspended'].includes(String(command.status)))throw Error('Administrator approval required.');
  next.status=command.status as PortalAccount['status'];
 }else{
  if(account.status==='suspended'||(account.status==='pending'&&command.type!=='profile'))throw Error('Your partner account is awaiting approval.');
  if(command.type==='profile'){
   const p=command.profile as Record<string,unknown>;if(!p)throw Error('Profile is required.');
   state.profile={name:portalText(p.name,150),company:portalText(p.company,200),phone:portalText(p.phone,40),address:portalText(p.address,500)};
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
export const portalCatalog=[
 {name:'Architectural surface films',description:'Explore finishes for cabinets, counters and appliances.',kind:'product'},
 {name:'Wallpaper & wall finishes',description:'Find a new texture, pattern or material for your space.',kind:'product'},
 {name:'Window films',description:'Discuss privacy and decorative film options.',kind:'product'},
 {name:'Installation',description:'Request installation planning for your selected finish.',kind:'service'},
 {name:'Site consultation',description:'Review surfaces, measurements and project requirements.',kind:'service'},
 {name:'Painting & specialty finishes',description:'Explore painting, Roman clay and faux concrete finishes.',kind:'service'},
] as const;
