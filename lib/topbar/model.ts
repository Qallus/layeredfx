import {OperationError} from '@/lib/operations/engine.mjs';
export type Notice={id:string;title:string;message:string;link:string;linkLabel:string;status:'draft'|'published'|'archived';start:string;end:string;priority:number};
export type NoticeState={revision:number;items:Notice[]};
export function activeNotices(items:Notice[],now=Date.now()){return items.filter(n=>n.status==='published'&&(!n.start||Date.parse(n.start)<=now)&&(!n.end||Date.parse(n.end)>now)).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));}
export function mutateNotice(state:NoticeState,method:string,body:Record<string,unknown>){
 if(body.revision!==state.revision)throw new OperationError('Another editor saved changes. Reload before saving.',409);
 const old=state.items.find(n=>n.id===body.id);if(method!=='POST'&&!old)throw new OperationError('Notification not found.',404);
 if(method==='DELETE')return {state:{revision:state.revision+1,items:state.items.filter(n=>n.id!==body.id)}};
 const text=(k:string,max:number)=>typeof body[k]==='string'?(body[k] as string).trim().slice(0,max):'';
 const title=text('title',100),message=text('message',240),link=text('link',500),linkLabel=text('linkLabel',80),status=String(body.status);
 if(!title||!message)throw new OperationError('Title and message are required.',400);
 if(!['draft','published','archived'].includes(status))throw new OperationError('Invalid status.',400);
 if(link&&!(/^\/(?!\/)[^\\]*$/.test(link)||/^https:\/\//.test(link)))throw new OperationError('Use a relative page URL or https URL.',400);
 if(/[\u0000-\u0020\u007f]/.test(link))throw new OperationError('Invalid link URL.',400);
 if(link.startsWith('https:')){try{const u=new URL(link);if(u.protocol!=='https:'||u.username||u.password)throw Error();}catch{throw new OperationError('Invalid link URL.',400);}}
 const date=(k:string)=>{let d=text(k,40);if(d&&!/(Z|[+-]\d\d:\d\d)$/.test(d))d+='-07:00';if(d&&!Number.isFinite(Date.parse(d)))throw new OperationError('Invalid schedule date.',400);return d;};
 const start=date('start'),end=date('end');if(start&&end&&Date.parse(end)<=Date.parse(start))throw new OperationError('End must be after start.',400);
 if(!old&&state.items.length>=100)throw new OperationError('Limit of 100 notifications reached.',400);
 const item:Notice={id:old?.id||crypto.randomUUID(),title,message,link,linkLabel,status:status as Notice['status'],start,end,priority:Math.min(100,Math.max(0,Number(body.priority)||0))};
 return {item,state:{revision:state.revision+1,items:[item,...state.items.filter(n=>n.id!==item.id)]}};
}
