import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowUpRight, Palette, PanelsTopLeft } from "lucide-react";
import { EstimateTrigger } from "./estimate-context";
import { HeroHeadline } from "./hero-headline";

// Stack-then-spread collage: mixed-shape cards fade into one centred stack, then spread to the edges and the copy rises in.
// a = aspect ratio (width/height). fw = final width in stage units (see --u in the CSS); x/y = final offset from the centre in % of the stage (cqw/cqh);
// m* are the phone layout. The stack size is derived in CSS from a, so every card's long side matches while stacked.
type Card = { src: string; a: number; fw: number; x: number; y: number; mfw: number; mx: number; my: number };
const room = (name: string) => `/images/${name}-photo.png`;
const finish = (name: string) => `/images/wall-wrap/finishes/${name}.webp`;
const cards: Card[] = [
  { src: room("window-film"), a: 1.3, fw: 9, x: 46, y: 3, mfw: 24, mx: 70, my: 0 },
  { src: finish("wood-cladding"), a: .7, fw: 7.5, x: -3, y: -40, mfw: 13, mx: -42, my: 36 },
  { src: finish("marble"), a: 1, fw: 5.5, x: 8, y: -37, mfw: 12, mx: 5, my: -44 },
  { src: room("architectural-room"), a: 1.15, fw: 16, x: 33, y: -36, mfw: 36, mx: 33, my: -40 },
  { src: finish("roman-clay"), a: 1, fw: 5.5, x: 34, y: -3, mfw: 12, mx: 70, my: 0 },
  { src: room("coffee-shop-wall-wrap"), a: .75, fw: 11.5, x: -24.5, y: 44, mfw: 24, mx: -20, my: 37 },
  { src: "/images/hero/faux-stone-portrait.webp", a: .6, fw: 10.5, x: -40, y: 30, mfw: 20, mx: -70, my: 0 },
  { src: room("wallpaper-room"), a: 1.45, fw: 12, x: 3, y: 43, mfw: 26, mx: 10, my: 44 },
  { src: finish("rock-wall"), a: 1, fw: 5.5, x: 21, y: 44, mfw: 12, mx: 70, my: 0 },
  { src: room("paint"), a: .66, fw: 10.5, x: 36, y: 30, mfw: 20, mx: 38, my: 36 },
  { src: room("kitchen"), a: 1.5, fw: 12, x: -19, y: -38, mfw: 30, mx: -10, my: -34 },
  { src: room("room-after"), a: .6, fw: 10.5, x: -36, y: -18, mfw: 20, mx: -40, my: -38 },
];

export function Hero() {
  return <section className="lfx-hero-burst" aria-labelledby="hero-title">
    <div className="lfx-burst-stage" aria-hidden="true">
      {cards.map((card, i) => <div key={card.src} className="lfx-burst-card" style={{ "--i": i, "--a": card.a, "--fw": card.fw, "--x": card.x, "--y": card.y, "--mfw": card.mfw, "--mx": card.mx, "--my": card.my } as CSSProperties}>
        <div className="lfx-burst-face"><Image src={card.src} alt="" fill priority={i >= cards.length - 4} sizes="(max-width: 700px) 60vw, 25vw" /></div>
      </div>)}
    </div>
    <div className="lfx-burst-copy">
      <div className="lfx-eyebrow"><span className="lfx-accent-line" />Same space. A whole new feeling.<span className="lfx-accent-line" /></div>
      <HeroHeadline />
      <p>Cabinet, countertop and wall wraps, Roman clay, window film, and paint for homes and businesses in Scottsdale and across Greater Phoenix. Thoughtfully chosen. Professionally applied.</p>
      <div className="lfx-hero-ctas"><EstimateTrigger size="lg">Customize Your Space <Palette size={19} /></EstimateTrigger><a className="lfx-button lfx-button-outline lfx-button-lg" href="#services">Explore Our Services <PanelsTopLeft size={17} /></a></div>
      <a href="#studio" className="lfx-text-link lfx-burst-studio">Find your finish in the material studio <ArrowUpRight size={16} /></a>
    </div>
    <span className="lfx-burst-label">Photorealistic design concepts &amp; finish samples</span>
  </section>;
}
