"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { inspiration } from "@/lib/layeredfx/content";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
export function Inspiration() {
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState<(typeof inspiration)[number] | null>(null);
  return <section id="inspiration" className="lfx-section lfx-inspiration"><div className="lfx-container">
    <div className="lfx-section-heading"><div><div className="lfx-eyebrow">03 / A little inspiration</div><h2>Imagine what<br /><em>comes next.</em></h2></div><div><p>A few directions to get your ideas moving. Make a space feel unmistakably yours.</p><div className="lfx-filter-row lfx-filter-compact" role="group" aria-label="Filter inspiration">{["all", "residential", "commercial"].map(value => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All spaces" : value}</button>)}</div></div></div>
    <div className="lfx-inspiration-grid">{inspiration.filter(item => filter === "all" || item.kind === filter).map(item => <button key={item.title} className="lfx-inspiration-card" onClick={() => setActive(item)}><div className="lfx-inspiration-image"><Image src={item.image} alt={`${item.title}, an illustrative design direction`} fill sizes="(max-width: 600px) 90vw, 33vw" /><span className="lfx-image-label">{item.kind}</span></div><div className="lfx-inspiration-title"><h3>{item.title}</h3><ArrowUpRight size={21} /></div><p>{item.description}</p></button>)}</div>
    <p className="lfx-small-note">Design concepts for inspiration. These are not photographs of completed LayeredFX projects.</p>
    <Dialog open={!!active} onOpenChange={value => !value && setActive(null)}><DialogContent>{active && <><div className="lfx-eyebrow">Illustrative design concept</div><DialogTitle>{active.title}</DialogTitle><DialogDescription>{active.description}. Consider {active.services.join(" and ").toLowerCase()} as a starting point for a conversation about your own space. This is sample inspiration, not a completed project.</DialogDescription><div className="lfx-dialog-art"><Image src={active.image} alt={`${active.title} concept`} fill sizes="550px" /></div></>}</DialogContent></Dialog>
  </div></section>;
}
