"use client";
import { useState } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "./ui/sheet";
import { EstimateTrigger } from "./estimate-context";
const links = [{ label: "Our services", href: "#services" }, { label: "Inspiration", href: "#inspiration" }, { label: "Our approach", href: "#approach" }, { label: "Design studio", href: "#studio" }];
export function Header() {
  const [open, setOpen] = useState(false);
  return <>
    <div className="lfx-topbar"><span>Beautiful spaces start at the surface.</span><span>Residential <span className="lfx-dot-separator">/</span> Commercial</span></div>
    <header className="lfx-header"><div className="lfx-header-inner"><Logo />
      <nav className="lfx-desktop-nav" aria-label="Primary navigation">{links.map(link => <a key={link.href} href={link.href}>{link.label}{link.href === "#studio" && <span className="lfx-live-dot" />}</a>)}</nav>
      <div className="lfx-header-actions"><EstimateTrigger size="sm" className="lfx-header-estimate">Get an estimate <ArrowUpRight size={16} /></EstimateTrigger>
        <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="lfx-menu-button" aria-label="Open navigation"><Menu size={24} /></Button></SheetTrigger><SheetContent>
          <SheetTitle className="lfx-menu-title">Explore LayeredFX</SheetTitle><SheetDescription className="lfx-menu-description">A new layer of possibility for your space.</SheetDescription>
          <nav className="lfx-mobile-nav" aria-label="Mobile navigation">{links.map((link, i) => <SheetClose asChild key={link.href}><a href={link.href}><span>0{i + 1}</span>{link.label}<ArrowUpRight size={20} /></a></SheetClose>)}</nav>
          <p className="lfx-menu-description">Explore the estimate preview from the homepage. Nothing is submitted.</p>
        </SheetContent></Sheet>
      </div></div>
    </header>
  </>;
}
