"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, Moon, Sun, ChevronDown } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "./ui/sheet";
import { EstimateTrigger } from "./estimate-context";
const links = [{ label: "Our services", href: "/#services" }, { label: "Inspiration", href: "/#inspiration" }, { label: "Our approach", href: "/#approach" }, { label: "Wall Studio", href: "/studio" }, { label: "Book a consultation", href: "/book" }, { label: "Contact", href: "/contact" }];
export function Header() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => { try { const saved=localStorage.getItem('lfx:frontend:theme'); const value=saved ? saved==='dark' : matchMedia('(prefers-color-scheme: dark)').matches; setDark(value); document.documentElement.dataset.frontendTheme=value?'dark':'light'; } catch {} }, []);
  function toggleTheme(){const value=!dark;setDark(value);document.documentElement.dataset.frontendTheme=value?'dark':'light';try{localStorage.setItem('lfx:frontend:theme',value?'dark':'light');}catch{}}

  return <>
    <div className="lfx-topbar"><span>Beautiful spaces start at the surface.</span><span>Residential <span className="lfx-dot-separator">/</span> Commercial</span></div>
    <header className="lfx-header"><div className="lfx-header-inner"><Logo />
      <nav className="lfx-desktop-nav" aria-label="Primary navigation">{links.map(link => <a key={link.href} href={link.href}>{link.label}{link.href === "#studio" && <span className="lfx-live-dot" />}</a>)}</nav>
      <div className="lfx-header-actions"><button className="lfx-theme-toggle" aria-label="Toggle frontend theme" aria-pressed={dark} onClick={toggleTheme}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button><details className="lfx-account" onKeyDown={e=>{if(e.key==='Escape')e.currentTarget.open=false;}}><summary>My Account <ChevronDown size={14}/></summary><div><a href="/login">Login</a><a href="/register">Register</a></div></details><EstimateTrigger size="sm" className="lfx-header-estimate">Get an estimate <ArrowUpRight size={16} /></EstimateTrigger>
        <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="lfx-menu-button" aria-label="Open navigation"><Menu size={24} /></Button></SheetTrigger><SheetContent>
          <SheetTitle className="lfx-menu-title">Explore LayeredFX</SheetTitle><SheetDescription className="lfx-menu-description">A new layer of possibility for your space.</SheetDescription>
          <nav className="lfx-mobile-nav" aria-label="Mobile navigation">{links.map((link, i) => <SheetClose asChild key={link.href}><a href={link.href}><span>0{i + 1}</span>{link.label}<ArrowUpRight size={20} /></a></SheetClose>)}</nav>
          <p className="lfx-menu-description">Explore the estimate preview from the homepage. Nothing is submitted.</p>
        </SheetContent></Sheet>
      </div></div>
    </header>
  </>;
}
