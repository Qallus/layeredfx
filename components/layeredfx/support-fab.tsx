"use client";
// Floating support button for public pages, adapted from Channel Cast OS components/site/support-fab.tsx.
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, CalendarCheck, Handshake, Headphones, Images, Layers3, LayoutTemplate, Mail, MessageSquare, Phone, Sparkles, X } from "lucide-react";
import "./support-fab.css";

const PHONE = { label: "(602) 777-3303", href: "tel:+16027773303" };
const EMAIL = "hello@layeredfx.com";
const OPTIONS = [
  { label: "Book a consultation", note: "Talk through your space with our team", icon: CalendarCheck, href: "/book" },
  { label: "Try Wall Studio", note: "Preview finishes on your own wall", icon: LayoutTemplate, href: "/studio" },
  { label: "Explore services", note: "Wraps, finishes, film and paint", icon: Layers3, href: "/services" },
  { label: "Browse inspiration", note: "Ideas for homes and businesses", icon: Images, href: "/inspiration" },
  { label: "Send us a message", note: "Share photos and project details", icon: MessageSquare, href: "/contact" },
  { label: "Trade & partner accounts", note: "Contractors, affiliates and vendors", icon: Handshake, href: "/register" },
];
// Wall Studio has its own sticky bottom controls, so the corner stays clear there.
const HIDDEN_ON = ["/studio"];

export function SupportFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    const onPointer = (event: PointerEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);
  useEffect(() => { setOpen(false); setDrawer(false); }, [pathname]);

  if (HIDDEN_ON.some(path => pathname === path || pathname?.startsWith(path + "/"))) return null;

  return <>
    <div ref={root} data-lfx-overlay="" className="lfx lfx-fab">
      {open && <div id={panelId} className="lfx-fab-panel" role="region" aria-label="LayeredFX support">
        <div className="lfx-fab-head"><p className="lfx-fab-title">Layered FX Support</p><p className="lfx-fab-hours">We are open Monday – Friday 9:00 am to 5:00 pm.</p></div>
        <a className="lfx-fab-row" href={PHONE.href}><Phone size={17} aria-hidden="true" /><span>{PHONE.label}</span></a>
        <a className="lfx-fab-row" href={`mailto:${EMAIL}`}><Mail size={17} aria-hidden="true" /><span>{EMAIL}</span></a>
        {/* No LayeredFX AI assistant is connected yet; shown as upcoming rather than a working action. */}
        <div className="lfx-fab-row is-soon" aria-disabled="true"><Sparkles size={17} aria-hidden="true" /><span>Talk to Eve AI</span><small>Coming soon</small></div>
        <div className="lfx-fab-foot"><button type="button" className="lfx-fab-start" onClick={() => { setOpen(false); setDrawer(true); }}>Get started <ArrowRight size={17} aria-hidden="true" /></button></div>
      </div>}
      <div className="lfx-fab-actions">
        {!open && <button type="button" className="lfx-fab-pill" aria-expanded={false} onClick={() => setOpen(true)}>Need Help? <span>Contact us</span></button>}
        <button ref={toggle} type="button" className="lfx-fab-button" aria-label={open ? "Close support" : "Open support"} aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => setOpen(value => !value)}>{open ? <X size={24} /> : <Headphones size={24} />}</button>
      </div>
    </div>

    <Dialog.Root open={drawer} onOpenChange={setDrawer}>
      <Dialog.Portal><div data-lfx-overlay="" className="lfx">
        <Dialog.Overlay className="lfx-dialog-overlay" />
        <Dialog.Content className="lfx-fab-drawer">
          <div className="lfx-fab-drawer-head">
            <div><p className="lfx-eyebrow">Get started</p><Dialog.Title className="lfx-fab-drawer-title">What brings you here?</Dialog.Title><Dialog.Description className="sr-only">Choose where you would like to start with LayeredFX.</Dialog.Description></div>
            <Dialog.Close className="lfx-fab-drawer-close" aria-label="Close"><X size={20} /></Dialog.Close>
          </div>
          <nav className="lfx-fab-options" aria-label="Get started options">
            {OPTIONS.map(({ label, note, icon: Icon, href }) => <Dialog.Close asChild key={href}><Link href={href} className="lfx-fab-option"><span className="lfx-fab-option-icon"><Icon size={17} aria-hidden="true" /></span><span className="lfx-fab-option-text"><b>{label}</b><small>{note}</small></span><ArrowRight size={16} aria-hidden="true" /></Link></Dialog.Close>)}
          </nav>
        </Dialog.Content>
      </div></Dialog.Portal>
    </Dialog.Root>
  </>;
}
