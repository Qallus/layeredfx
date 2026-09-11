import sanitize from 'sanitize-html';
import {OperationError} from '@/lib/operations/engine.mjs';
import type {ContentItem} from '@/ctrlp/lib/admin/types';
export type BlogState={revision:number;items:ContentItem[]};
export function cleanHtml(html:string){return sanitize(html,{allowedTags:['p','div','span','h1','h2','h3','h4','strong','em','b','i','u','ul','ol','li','blockquote','cite','pre','code','br','hr','a','img'],allowedAttributes:{a:['href','title'],img:['src','alt','width','height']},allowedSchemes:['https','http'],allowProtocolRelative:false});}
function text(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):'';}
function url(value:unknown){const s=text(value,2000);return /^https?:\/\//i.test(s)||/^\/(?!\/)/.test(s)?s:null;}
export function published(items:ContentItem[],now=Date.now()){return items.filter(p=>(p.status==='published'||p.status==='scheduled')&&!!p.published_at&&Date.parse(p.published_at)<=now).sort((a,b)=>Date.parse(b.published_at!)-Date.parse(a.published_at!));}
export function mutateBlog(state:BlogState,method:string,body:Record<string,unknown>):{state:BlogState;item?:ContentItem}{
 if(body.revision!==state.revision)throw new OperationError('Another editor saved changes. Reload before saving again.',409);
 const previous=state.items.find(p=>p.id===body.id);
 if(method!=='POST'&&!previous)throw new OperationError('Post not found.',404);
 if(method==='DELETE')return {state:{revision:state.revision+1,items:state.items.filter(p=>p.id!==body.id)}};
 if(body.content_type!=='blog_post')throw new OperationError('Only blog posts can be saved here.',400);
 const title=text(body.title,180),slug=text(body.slug,180).toLowerCase();
 if(!title||!slug||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new OperationError('A title and a valid URL slug are required.',400);
 if(state.items.some(p=>p.slug===slug&&p.id!==previous?.id))throw new OperationError('That URL slug is already in use.',409);
 if(!['draft','published','scheduled','archived'].includes(String(body.status)))throw new OperationError('Invalid post status.',400);
 const now=new Date().toISOString();let date=body.published_at?String(body.published_at):null;
 if(date&&!/(Z|[+-]\d\d:\d\d)$/.test(date))date+='-07:00';
 if(date&&!Number.isFinite(Date.parse(date)))throw new OperationError('Invalid publication date.',400);
 if(body.status==='scheduled'&&!date)throw new OperationError('Scheduled posts need a publication date.',400);
 if(body.status==='published'&&!date)date=previous?.published_at||now;
 if(!previous&&state.items.length>=1000)throw new OperationError('The publication has reached its post limit.',413);
 const list=(key:string)=>Array.isArray(body[key])?(body[key] as unknown[]).slice(0,20).map(v=>text(v,80)).filter(Boolean):[];
 const item:ContentItem={id:previous?.id||crypto.randomUUID(),content_type:'blog_post',title,slug,content:cleanHtml(text(body.content,180000)),excerpt:text(body.excerpt,600)||null,status:body.status as ContentItem['status'],published_at:date,featured_image_url:url(body.featured_image_url),video_url:url(body.video_url),tags:list('tags'),categories:list('categories'),gallery:Array.isArray(body.gallery)?body.gallery.slice(0,20).flatMap(g=>g&&url(g.url)?[{url:url(g.url)!,alt:text(g.alt,200),caption:text(g.caption,300)}]:[]):[],meta_title:text(body.meta_title,180)||null,meta_description:text(body.meta_description,300)||null,created_at:previous?.created_at||now,updated_at:now,author_id:previous?.author_id||null,source_id:null,subject:null,preheader:null,image_url:null,hashtags:[]};
 return {item,state:{revision:state.revision+1,items:[item,...state.items.filter(p=>p.id!==item.id)]}};
}
