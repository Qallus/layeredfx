"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { Slider } from "./ui/slider";
import { EstimateTrigger } from "./estimate-context";
export function Comparison() {
  const [value, setValue] = useState(44);
  return <section className="lfx-section lfx-container lfx-comparison-section"><div className="lfx-comparison-image">
    <Image src="/images/room-transformed.svg" alt="Warm mineral wall finish concept" fill sizes="(max-width: 850px) 95vw, 55vw" />
    <div className="lfx-comparison-before" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}><Image src="/images/room-original.svg" alt="Neutral gray original room concept" fill sizes="(max-width: 850px) 95vw, 55vw" /></div>
    <span className="lfx-compare-label lfx-compare-left">Original concept</span><span className="lfx-compare-label lfx-compare-right">Finish concept</span>
    <div className="lfx-compare-line" style={{ left: `${value}%` }}><span><ArrowLeftRight size={19} /></span></div>
    <div className="lfx-compare-slider"><Slider label="Compare original and finish concepts" min={5} max={95} step={1} value={[value]} onValueChange={values => setValue(values[0])} /></div>
    <span className="lfx-compare-hint">Drag the slider to explore</span>
  </div><div className="lfx-comparison-copy"><div className="lfx-eyebrow">A different point of view</div><h2>Change the finish.<br /><em>Change the feeling.</em></h2><p>The layout stays familiar. The atmosphere becomes something entirely new. Explore how texture, color, and finish can change your experience of a space.</p><EstimateTrigger variant="outline">Talk through your ideas <ArrowUpRight size={18} /></EstimateTrigger><p className="lfx-small-note">Illustrative finish study, not an actual before-and-after project. Final appearance varies by material and application.</p></div></section>;
}
