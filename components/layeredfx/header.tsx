"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Moon, Sun, ChevronDown } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "./ui/sheet";
import { serviceGroups } from "@/lib/layeredfx/content";
import { serviceSlug } from "@/lib/layeredfx/service-pages";
const links = [{ label: "Inspiration", href: "/inspiration" }, { label: "About Us", href: "/about" }, { label: "Wall Studio", href: "/studio" }, { label: "Contact", href: "/contact" }];
const menuGroups = [
 {id:'wraps',title:'Architectural wraps',services:serviceGroups[0].services},
 {id:'finishes',title:'Decorative finishes',services:serviceGroups[1].services},
 {id:'film-paint',title:'Window film & painting',services:[...serviceGroups[2].services,...serviceGroups[3].services]},
];
export function Header() {
  const hoverClose = useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(hoverClose.current)clearTimeout(hoverClose.current);},[]);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => { try { const saved=localStorage.getItem('lfx:frontend:theme'); const value=saved ? saved==='dark' : matchMedia('(prefers-color-scheme: dark)').matches; setDark(value); document.documentElement.dataset.frontendTheme=value?'dark':'light'; } catch {} }, []);
  function toggleTheme(){const value=!dark;setDark(value);document.documentElement.dataset.frontendTheme=value?'dark':'light';try{localStorage.setItem('lfx:frontend:theme',value?'dark':'light');}catch{}}

  return <>
    <div className="lfx-topbar"><span>Beautiful spaces start at the surface.</span><span>Residential <span className="lfx-dot-separator">/</span> Commercial</span></div>
    <header className="lfx-header"><div className="lfx-header-inner"><Logo />
      <nav className="lfx-desktop-nav" aria-label="Primary navigation"><details className="lfx-mega" onPointerEnter={e=>{if(e.pointerType!=='mouse')return;if(hoverClose.current)clearTimeout(hoverClose.current);e.currentTarget.open=true;}} onPointerLeave={e=>{if(e.pointerType!=='mouse')return;const menu=e.currentTarget;hoverClose.current=setTimeout(()=>{if(!menu.contains(document.activeElement))menu.open=false;},180);}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))e.currentTarget.open=false;}} onKeyDown={e=>{if(e.key==='Escape')e.currentTarget.open=false;}}><summary>Services</summary><div className="lfx-mega-panel">{menuGroups.map(group=><section key={group.id}><h3>{group.title}</h3>{group.services.map(name=><Link key={name} href={`/services/${serviceSlug(name)}`}>{name}</Link>)}</section>)}<div className="lfx-mega-cta"><div><h2>Reimagine your space.</h2><p>Explore a finish on your wall, or talk through the possibilities with us.</p></div><div className="lfx-mega-cta-actions"><Button asChild variant="outline" size="sm"><Link href="/studio">Open Wall Studio</Link></Button><Button asChild size="sm"><Link href="/book">Book a Consultation</Link></Button></div></div></div></details>{links.map(link => <Link key={link.href} href={link.href}>{link.label}{link.href === "#studio" && <span className="lfx-live-dot" />}</Link>)}</nav>
      <div className="lfx-header-actions"><button className="lfx-theme-toggle" aria-label="Toggle frontend theme" aria-pressed={dark} onClick={toggleTheme}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button><details className="lfx-account" onKeyDown={e=>{if(e.key==='Escape')e.currentTarget.open=false;}}><summary>My Account <ChevronDown size={14}/></summary><div><Link href="/login">Login</Link><Link href="/register">Register</Link></div></details><Button asChild size="sm" className="lfx-header-estimate"><Link href="/book">Book a Consultation <ArrowUpRight size={16}/></Link></Button>
        <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="lfx-menu-button" aria-label="Open navigation"><Menu size={24} /></Button></SheetTrigger><SheetContent>
          <SheetTitle className="lfx-menu-title">Explore LayeredFX</SheetTitle><SheetDescription className="lfx-menu-description">A new layer of possibility for your space.</SheetDescription>
          <nav className="lfx-mobile-nav" aria-label="Mobile navigation"><SheetClose asChild><Link href="/book">Book a Consultation<ArrowUpRight size={20}/></Link></SheetClose><details className="lfx-mobile-services"><summary>Services</summary>{menuGroups.map(group=><section key={group.id}><h3>{group.title}</h3>{group.services.map(name=><SheetClose asChild key={name}><Link href={`/services/${serviceSlug(name)}`}>{name}</Link></SheetClose>)}</section>)}</details>{links.map((link, i) => <SheetClose asChild key={link.href}><Link href={link.href}><span>0{i + 1}</span>{link.label}<ArrowUpRight size={20} /></Link></SheetClose>)}</nav>
          <p className="lfx-menu-description">Explore finishes in Wall Studio, or book a consultation to discuss your space.</p>
        </SheetContent></Sheet>
      </div></div>
    </header>
  </>;
}
