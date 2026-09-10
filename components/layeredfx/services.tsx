"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Check } from "lucide-react";
import { serviceGroups } from "@/lib/layeredfx/content";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { useEstimate } from "./estimate-context";
const filters = [{ id: "all", label: "All services" }, { id: "wraps", label: "Wrap & resurface" }, { id: "finishes", label: "Architectural finishes" }, { id: "film-paint", label: "Film & paint" }];
export function Services() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<(typeof serviceGroups)[number] | null>(null);
  const { openEstimate } = useEstimate();
  const groups = serviceGroups.filter(group => filter === "all" || group.category === filter);
  return <section id="services" className="lfx-section lfx-container">
    <div className="lfx-section-heading"><div><div className="lfx-eyebrow">01 / What we do</div><h2>A surface for<br /><em>every possibility.</em></h2></div><p>From the smallest detail to an entirely new atmosphere. Discover a different way to transform the spaces around you.</p></div>
    <div className="lfx-filter-row" role="group" aria-label="Filter services">{filters.map(item => <button key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
    <div className="lfx-service-grid" aria-live="polite">{groups.map(group => <article className="lfx-service-card" key={group.id}>
      <button className="lfx-service-image" onClick={() => setSelected(group)} aria-label={`Explore ${group.title}`}><Image src={group.image} alt={`${group.title} illustrative surface concept`} fill sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 25vw" /><span className="lfx-service-number">{group.number}</span><span className="lfx-round-arrow"><ArrowUpRight size={20} /></span></button>
      <h3><button onClick={() => setSelected(group)}>{group.title}</button></h3><p>{group.subtitle}</p><div className="lfx-service-list">{group.services.join(" · ")}</div>
    </article>)}</div>
    <Dialog open={!!selected} onOpenChange={value => !value && setSelected(null)}><DialogContent>{selected && <>
      <div className="lfx-eyebrow">LayeredFX / Our services</div><DialogTitle>{selected.title}</DialogTitle><DialogDescription>{selected.detail}</DialogDescription>
      <ul className="lfx-service-dialog-list">{selected.services.map(service => <li key={service}><Check size={17} />{service}</li>)}</ul>
      <p className="lfx-preview-note">Homepage preview. A project consultation will confirm material suitability, scope, and pricing.</p>
      <Button onClick={() => { const service = selected.services[0]; setSelected(null); window.setTimeout(() => openEstimate(service), 160); }}>Explore an estimate <ArrowUpRight size={17} /></Button>
    </>}</DialogContent></Dialog>
  </section>;
}
