import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUpRight, Layers3, MoveUpRight } from "lucide-react";
import { EstimateTrigger } from "./estimate-context";
export function Hero() {
  return <section className="lfx-hero lfx-container" aria-labelledby="hero-title">
    <div className="lfx-hero-copy"><div className="lfx-eyebrow"><span className="lfx-accent-line" />A new layer of possibility</div>
      <h1 id="hero-title">Same space.<br />A whole<br /><em>new feeling.</em></h1>
      <p>Beautiful wraps, architectural finishes, window film, and paint. Thoughtfully chosen. Professionally applied.</p>
      <div className="lfx-hero-ctas"><EstimateTrigger size="lg">Let’s reimagine your space <ArrowUpRight size={19} /></EstimateTrigger><a className="lfx-text-link" href="#services">Explore our services <ArrowRight size={17} /></a></div>
      <div className="lfx-hero-bottom"><span className="lfx-hero-stamp"><Layers3 size={22} /></span><span>Less ordinary.<br /><strong>More you.</strong></span><a href="#services" className="lfx-scroll-button" aria-label="Scroll to services"><ArrowDown size={19} /></a></div>
    </div>
    <div className="lfx-hero-art"><Image src="/images/architectural-room.svg" alt="Illustrative interior concept with a textured wall, warm wood, and soft furnishings" fill priority sizes="(max-width: 850px) 100vw, 55vw" />
      <div className="lfx-image-top"><span className="lfx-image-label">The art of transformation</span><span className="lfx-image-icon"><MoveUpRight size={22} /></span></div>
      <a href="#studio" className="lfx-material-note"><span className="lfx-note-swatches"><i /><i /><i /></span><span>Find your finish<small>Explore the material studio</small></span><ArrowUpRight size={23} /></a>
      <span className="lfx-concept-label">Interior concept · Illustrative artwork</span>
    </div>
  </section>;
}
