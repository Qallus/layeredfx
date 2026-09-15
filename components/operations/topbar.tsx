"use client";
// Dashboard top bar, laid out like Channel Cast: account type › breadcrumbs on the left; search, notifications,
// theme, round avatar and email on the right. The avatar opens the account menu (profile, settings, sign out).
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ChevronRight,LogOut,Menu,Moon,Settings,Sun,UserRound} from 'lucide-react';
import {dashboardNavigation,type DashboardNavItem} from '@/lib/dashboard/navigation';
import {useOperations} from './provider';
import {GlobalSearch} from './global-search';
import {NotificationBell} from './notification-bell';

type State=ReturnType<typeof useOperations>['state'];
type Crumb={label:string;href?:string};
const ROLE_LABEL:Record<string,string>={admin:'Admin',staff:'Staff',viewer:'Viewer'};
// Record pages show the record's own name as the last breadcrumb.
const RECORD_NAME:Record<string,(state:State,id:string)=>string|undefined>={
 '/admin/pipeline':(s,id)=>s.deals.find(d=>d.id===id)?.name,
 '/admin/workspace':(s,id)=>s.documents.find(d=>d.id===id)?.title,
 '/admin/plans':(s,id)=>s.plans.find(p=>p.id===id)?.name,
};
const initials=(name:string)=>name.split(/\s+/).filter(Boolean).map(part=>part[0]).slice(0,2).join('').toUpperCase()||'?';
const titleCase=(slug:string)=>slug.split('-').filter(Boolean).map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');

function useCrumbs(path:string,state:State):Crumb[]{
 return useMemo(()=>{
  let best:{item:DashboardNavItem;parent?:DashboardNavItem}|null=null;
  for(const group of dashboardNavigation)for(const item of group.items)for(const candidate of [{item},...(item.children||[]).map(child=>({item:child,parent:item}))]){
   const href=candidate.item.href;const hit=path===href||(href!=='/admin'&&path.startsWith(`${href}/`));
   if(hit&&(!best||href.length>best.item.href.length))best=candidate;
  }
  if(!best)return [{label:'Dashboard'}];
  const trail:Crumb[]=[];
  if(best.parent)trail.push({label:best.parent.label,href:best.parent.href});
  const rest=path.slice(best.item.href.length).split('/').filter(Boolean);
  trail.push({label:best.item.label,href:rest.length?best.item.href:undefined});
  if(rest.length){const segment=rest[0];trail.push({label:RECORD_NAME[best.item.href]?.(state,segment)||(/^[a-z-]+$/.test(segment)?titleCase(segment):'Details')});}
  return trail;
 },[path,state]);
}

export function DashboardTopbar({theme,status,onToggleTheme,onOpenNav}:{theme:string;status:string;onToggleTheme:()=>void;onOpenNav:()=>void}){
 const {actor,mode,state}=useOperations();const path=usePathname();const trail=useCrumbs(path,state);
 const profile=state.memberProfiles?.[actor.id];
 return <header className="ops-topbar">
  <button type="button" className="ops-menu" aria-label="Open navigation" onClick={onOpenNav}><Menu size={22}/></button>
  <nav className="ops-crumbs" aria-label="Breadcrumb">
   <span>{ROLE_LABEL[actor.role]||actor.role}</span>
   {trail.map((crumb,i)=><span key={`${crumb.label}-${i}`} className="ops-crumb"><ChevronRight size={14} aria-hidden/>{crumb.href?<Link href={crumb.href}>{crumb.label}</Link>:<span aria-current="page">{crumb.label}</span>}</span>)}
  </nav>
  <div className="ops-topbar-right">
   <span className="ops-save-status" role="status">{status}</span>
   <GlobalSearch/>
   <NotificationBell/>
   <button type="button" className="ops-icon-button" aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} onClick={onToggleTheme}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button>
   <AccountMenu name={profile?.fullName||actor.name} email={actor.email||''} avatarUrl={profile?.avatarUrl||''} canSignOut={mode==='supabase'}/>
  </div>
 </header>;
}

function AccountMenu({name,email,avatarUrl,canSignOut}:{name:string;email:string;avatarUrl:string;canSignOut:boolean}){
 const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!open)return;const onDown=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false);};const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};document.addEventListener('mousedown',onDown);document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('mousedown',onDown);document.removeEventListener('keydown',onKey);};},[open]);
 async function signOut(){await fetch('/api/operations/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});location.assign('/admin/login');}
 return <div className="ops-account" ref={ref}>
  <button type="button" className="ops-account-trigger" aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${name}`} onClick={()=>setOpen(value=>!value)}>
   {avatarUrl?<img className="ops-account-avatar" src={avatarUrl} alt=""/>:<span className="ops-account-avatar" aria-hidden>{initials(name)}</span>}
   {email&&<span className="ops-account-email">{email}</span>}
  </button>
  {open&&<div className="ops-popover ops-account-menu" role="menu">
   <div className="ops-account-head"><b>{name}</b>{email&&<small>{email}</small>}</div>
   <Link role="menuitem" href="/admin/profile" onClick={()=>setOpen(false)}><UserRound size={15}/>My profile</Link>
   <Link role="menuitem" href="/admin/settings" onClick={()=>setOpen(false)}><Settings size={15}/>Settings</Link>
   {canSignOut&&<button type="button" role="menuitem" onClick={()=>void signOut()}><LogOut size={15}/>Sign out</button>}
  </div>}
 </div>;
}
