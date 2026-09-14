"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ChevronDown} from 'lucide-react';
import {dashboardNavigation,type DashboardNavItem} from '@/lib/dashboard/navigation';

const OPEN_GROUPS_KEY='lfx:dashboard:nav-open';
// Exact match or a nested route, so /admin/production is not active on /admin/production-schedule.
const isActive=(href:string,path:string)=>href==='/admin'?path===href:path===href||path.startsWith(href+'/');
const containsPath=(item:DashboardNavItem,path:string)=>isActive(item.href,path)||!!item.children?.some(child=>isActive(child.href,path));

export function DashboardNav({path,collapsed,pipelineCount,onNavigate}:{path:string;collapsed:boolean;pipelineCount:number;onNavigate:()=>void}){
 const [open,setOpen]=useState<string[]>([]);
 useEffect(()=>{try{const saved:unknown=JSON.parse(localStorage.getItem(OPEN_GROUPS_KEY)||'[]');if(Array.isArray(saved))setOpen(prev=>[...new Set([...prev,...saved.filter((x):x is string=>typeof x==='string')])]);}catch{}},[]);
 // Keep the group holding the current page expanded.
 useEffect(()=>{const current=dashboardNavigation.flatMap(group=>group.items).filter(item=>item.children&&containsPath(item,path)).map(item=>item.href);if(current.length)setOpen(prev=>current.every(href=>prev.includes(href))?prev:[...new Set([...prev,...current])]);},[path]);
 function toggle(href:string){setOpen(prev=>{const next=prev.includes(href)?prev.filter(x=>x!==href):[...prev,href];try{localStorage.setItem(OPEN_GROUPS_KEY,JSON.stringify(next));}catch{}return next;});}
 function item(n:DashboardNavItem){
  const Icon=n.icon;
  if(n.soon)return <div key={n.href} className="ops-nav-soon" aria-disabled="true" title={collapsed?`${n.label} (coming soon)`:undefined}><Icon size={18}/><span className="ops-nav-text">{n.label}</span><span className="ops-nav-count">Soon</span></div>;
  const active=isActive(n.href,path);
  return <Link key={n.href} href={n.href} className={active?'active':''} aria-label={n.label} title={collapsed?n.label:undefined} aria-current={active?'page':undefined} onClick={onNavigate}><Icon size={18}/><span className="ops-nav-text">{n.label}</span>{n.label==='Pipeline'&&<span className="ops-nav-count">{pipelineCount}</span>}</Link>;
 }
 return <nav aria-label="Dashboard navigation">{dashboardNavigation.map(group=><section key={group.label}><p className="ops-sidebar-label">{group.label}</p>{group.items.map(n=>{
  if(!n.children)return item(n);
  const expanded=open.includes(n.href);const id=`ops-nav-group-${n.href.split('/').pop()}`;
  return <div key={n.href} className={`ops-nav-group${containsPath(n,path)?' has-active':''}`} data-open={expanded}>
   <div className="ops-nav-parent">{item(n)}<button type="button" className="ops-nav-toggle" aria-expanded={expanded} aria-controls={id} aria-label={`${expanded?'Hide':'Show'} ${n.label} pages`} onClick={()=>toggle(n.href)}><ChevronDown size={16}/></button></div>
   <div id={id} className="ops-nav-children" role="group" aria-label={n.label}>{n.children.map(item)}</div>
  </div>;
 })}</section>)}</nav>;
}
