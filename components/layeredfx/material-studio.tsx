"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MoveUpRight, Pause, Play, RotateCcw } from "lucide-react";
import { finishes, type FinishId, type Service } from "@/lib/layeredfx/content";
import type { MaterialSceneControls } from "@/lib/layeredfx/material-scene";
import { useEstimate } from "./estimate-context";
import { Button } from "./ui/button";
const serviceByFinish: Record<FinishId, Service> = { clay: "Roman clay", oak: "Cabinet wraps", stone: "Countertop wraps", charcoal: "Interior painting" };
export function MaterialStudio() {
  const [finish, setFinish] = useState<FinishId>("clay");
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState("loading");
  const [reducedMotion, setReducedMotion] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MaterialSceneControls | null>(null);
  const finishRef = useRef(finish); finishRef.current = finish;
  const pauseRef = useRef(paused); pauseRef.current = paused;
  const visibleRef = useRef(false);
  const reducedRef = useRef(false);
  const { openEstimate } = useEstimate();
  const selected = finishes.find(item => item.id === finish)!;
  useEffect(() => {
    const host = hostRef.current; if (!host) return;
    let cancelled = false, loading = false;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function synchronize() { sceneRef.current?.setPaused(pauseRef.current || reducedRef.current || !visibleRef.current || document.hidden); }
    const preference = () => { reducedRef.current = media.matches; setReducedMotion(media.matches); synchronize(); };
    preference(); media.addEventListener("change", preference); document.addEventListener("visibilitychange", synchronize);
    const observer = new IntersectionObserver(async entries => {
      visibleRef.current = entries[0].isIntersecting;
      if (visibleRef.current && !sceneRef.current && !loading) {
        loading = true;
        try {
          const { mountMaterialScene } = await import("@/lib/layeredfx/material-scene");
          if (cancelled) return;
          sceneRef.current = mountMaterialScene(host, finishRef.current, () => setStatus("unavailable"));
          setStatus("ready");
        } catch { if (!cancelled) setStatus("unavailable"); }
      }
      synchronize();
    }, { threshold: 0.05 }); observer.observe(host);
    return () => { cancelled = true; observer.disconnect(); media.removeEventListener("change", preference); document.removeEventListener("visibilitychange", synchronize); sceneRef.current?.dispose(); sceneRef.current = null; };
  }, []);
  useEffect(() => { sceneRef.current?.setFinish(finish); }, [finish]);
  useEffect(() => { sceneRef.current?.setPaused(paused || reducedRef.current || !visibleRef.current || document.hidden); }, [paused]);
  return <section id="studio" className="lfx-studio-section"><div className="lfx-container lfx-studio-grid"><div className="lfx-studio-copy"><div className="lfx-eyebrow">02 / The material studio <span className="lfx-tag">Interactive</span></div><h2>Some things<br />you need<br /><em>to see to feel.</em></h2><p>Natural warmth. Quiet texture. A striking contrast. Explore a few finish directions, then tell us what feels like you.</p><div className="lfx-finish-options" role="group" aria-label="Choose material finish">{finishes.map(item => <button key={item.id} aria-label={item.name} aria-pressed={finish === item.id} onClick={() => setFinish(item.id)}><span className={`lfx-swatch lfx-swatch-${item.id}`} /><small>{item.name}</small></button>)}</div><div className="lfx-selected-finish" aria-live="polite"><strong>{selected.name}</strong><span>{selected.description}</span></div><Button variant="outline" onClick={() => openEstimate(serviceByFinish[finish], selected.name)}>Start with this finish <ArrowUpRight size={17} /></Button><p className="lfx-small-note">Illustrative finish concepts, not manufacturer samples. Final color and appearance require a physical sample.</p></div>
    <div className="lfx-studio-art" data-three-status={status}><div className="lfx-studio-art-header"><span><span className="lfx-live-dot" />The finish collection</span><span>01 — 04</span></div>
      <div className={`lfx-scene-fallback ${status === "ready" ? "lfx-scene-hidden" : ""} ${paused || reducedMotion ? "lfx-scene-paused" : ""}`} aria-hidden="true"><div className="lfx-fallback-panels"><div className="lfx-fallback-panel lfx-fallback-back" /><div className="lfx-fallback-panel lfx-fallback-middle" /><div className={`lfx-fallback-panel lfx-fallback-front lfx-swatch-${finish}`} /></div></div>
      <div className={`lfx-three-host ${status === "unavailable" ? "lfx-three-unavailable" : ""}`} ref={hostRef} role="img" aria-label={`Three-dimensional illustrative material samples: ${selected.name}`} />
      <div className="lfx-studio-art-footer"><div><span className="lfx-eyebrow">A new layer of possibility</span><strong>{selected.name}<MoveUpRight size={18} /></strong></div><Button variant="ghost" size="icon" aria-label={paused ? "Play material animation" : "Pause material animation"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={18} /> : <Pause size={18} />}</Button></div><div className="lfx-scene-hint"><RotateCcw size={15} />{reducedMotion ? "Reduced motion enabled" : status === "unavailable" ? "Static preview · 3D unavailable" : "Move your cursor. Explore the layers."}</div>
    </div>
  </div></section>;
}
