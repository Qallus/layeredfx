"use client";
import {NavigationMenu,NavigationMenuList,NavigationMenuItem,NavigationMenuTrigger,NavigationMenuContent,NavigationMenuLink} from './ui/navigation-menu';
import './navigation.css';
import {TopBar} from "./topbar";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Menu, Moon, Sun } from "lucide-react";
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
const serviceCount = menuGroups.reduce((total, group) => total + group.services.length, 0);
export function Header({studio=false}: {studio?:boolean}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"main" | "services">("main");
  const servicesButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const [dark, setDark] = useState(false);
  useEffect(() => { try { const saved=localStorage.getItem('lfx:frontend:theme'); const value=saved ? saved==='dark' : matchMedia('(prefers-color-scheme: dark)').matches; setDark(value); document.documentElement.dataset.frontendTheme=value?'dark':'light'; } catch {} }, []);
  function toggleTheme(){const value=!dark;setDark(value);document.documentElement.dataset.frontendTheme=value?'dark':'light';try{localStorage.setItem('lfx:frontend:theme',value?'dark':'light');}catch{}}
  // Slide between the main menu and the Services panel, moving focus into the panel that becomes visible.
  function showPanel(next: "main" | "services") { setPanel(next); requestAnimationFrame(() => (next === "services" ? backButton : servicesButton).current?.focus({ preventScroll: true })); }

  return <>
    {!studio&&<TopBar/>}
    <header className={"lfx-header lfx-compact-header"+(studio?" lfx-studio-header":"")}><div className="lfx-header-inner">{studio?<Link href="/" className="lfx-app-icon" aria-label="LayeredFX home"><img src="/brand/layeredfx_app_icon.svg" alt="" width={38} height={38}/></Link>:<Logo />}
      <NavigationMenu className="lfx-desktop-nav" aria-label="Primary navigation" delayDuration={100}><NavigationMenuList className="lfx-navigation-list"><NavigationMenuItem><NavigationMenuTrigger className="lfx-nav-trigger">Services</NavigationMenuTrigger><NavigationMenuContent><div className="lfx-mega-panel">{menuGroups.map(group=><section key={group.id}><h3>{group.title}</h3>{group.services.map(name=><NavigationMenuLink asChild key={name}><Link href={`/services/${serviceSlug(name)}`}>{name}</Link></NavigationMenuLink>)}</section>)}<div className="lfx-mega-cta"><div><h2>Reimagine your space.</h2><p>Explore a finish on your wall, or talk through the possibilities with us.</p></div><div className="lfx-mega-cta-actions"><Button asChild variant="outline" size="sm"><Link href="/studio">Open Wall Studio</Link></Button><Button asChild size="sm"><Link href="/book">Book a Consultation</Link></Button></div></div></div></NavigationMenuContent></NavigationMenuItem>{links.map(link => <NavigationMenuItem key={link.href}><NavigationMenuLink asChild><Link href={link.href}>{link.label}</Link></NavigationMenuLink></NavigationMenuItem>)}</NavigationMenuList></NavigationMenu>
      <div className="lfx-header-actions"><button className="lfx-theme-toggle" aria-label="Toggle frontend theme" aria-pressed={dark} onClick={toggleTheme}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button><details className="lfx-account" onKeyDown={e=>{if(e.key==='Escape')e.currentTarget.open=false;}}><summary>My Account</summary><div><Link href="/login">Login</Link><Link href="/register">Register</Link></div></details><Button asChild size="sm" className="lfx-header-estimate"><Link href="/book">Book a Consultation <ArrowUpRight size={16}/></Link></Button>
        <Sheet open={open} onOpenChange={value => { setOpen(value); if (value) setPanel("main"); }}><SheetTrigger asChild><Button variant="ghost" size="icon" className="lfx-menu-button" aria-label="Open navigation"><Menu size={24} /></Button></SheetTrigger><SheetContent>
          <div className="lfx-menu-head"><SheetClose asChild><Link href="/" className="lfx-app-icon lfx-menu-icon" aria-label="LayeredFX home"><img src="/brand/layeredfx_app_icon.svg" alt="" width={44} height={44}/></Link></SheetClose><SheetTitle className="sr-only">LayeredFX menu</SheetTitle><SheetDescription className="sr-only">Browse LayeredFX services and pages.</SheetDescription></div>
          <div className="lfx-menu-viewport"><div className="lfx-menu-track" data-panel={panel}>
            <div className="lfx-menu-panel" inert={panel !== "main"}>
              <p className="lfx-menu-description">A new layer of possibility for your space.</p>
              <nav className="lfx-mobile-nav" aria-label="Mobile navigation">
                <SheetClose asChild><Link href="/book">Book a Consultation</Link></SheetClose>
                <button type="button" ref={servicesButton} className="lfx-menu-more" aria-controls="lfx-menu-services" aria-expanded={panel === "services"} onClick={() => showPanel("services")}>Services<span className="lfx-menu-count" aria-hidden="true">{serviceCount}</span><ChevronRight size={22} aria-hidden="true" /></button>
                {links.map((link, i) => <SheetClose asChild key={link.href}><Link href={link.href}><span>0{i + 1}</span>{link.label}</Link></SheetClose>)}
              </nav>
              <p className="lfx-menu-description">Explore finishes in Wall Studio, or book a consultation to discuss your space.</p>
            </div>
            <div className="lfx-menu-panel lfx-menu-services" id="lfx-menu-services" inert={panel !== "services"}>
              <button type="button" ref={backButton} className="lfx-menu-back" onClick={() => showPanel("main")}><ChevronLeft size={20} aria-hidden="true" />Back to menu</button>
              <h2 className="lfx-menu-panel-title">Services</h2>
              <nav aria-label="Services navigation">{menuGroups.map(group => <section key={group.id}><h3>{group.title}</h3><div className="lfx-mobile-nav">{group.services.map(name => <SheetClose asChild key={name}><Link href={`/services/${serviceSlug(name)}`}>{name}</Link></SheetClose>)}</div></section>)}</nav>
            </div>
          </div></div>
        </SheetContent></Sheet>
      </div></div>
    </header>
  </>;
}
