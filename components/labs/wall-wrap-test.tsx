"use client";
// Wall-wrap samples: the same photorealistic room shown three ways for comparison. Layer order in every
// sample: room photo → finish wraps clipped by the wall mask (room wall lighting blended on top) →
// sectional cutout → plant cutout. Positions are pixel offsets measured against
// docs/images/house_couch_coffee_table.png, expressed as percentages of the 2526×1422 room.
import {useState, type CSSProperties} from 'react';
import './wall-wrap-test.css';

type Finish = {id: string; name: string; detail: string; background: string};
const texture = (file: string) => `url(/images/wall-wrap/finishes/${file}.webp) center/cover no-repeat`;
// Finishes in reveal order, from docs/textures/layeredfx-full-frame-regenerated-textures-1925x1056 (converted to WebP).
const FINISHES: Finish[] = [
  {id: 'faux-concrete', name: 'Faux concrete', detail: 'Hand-troweled concrete look', background: texture('faux-concrete')},
  {id: 'marble', name: 'Marble', detail: 'Veined stone look', background: texture('marble')},
  {id: 'wood-cladding', name: 'Wood cladding', detail: 'Vertical slat look', background: texture('wood-cladding')},
  {id: 'roman-clay', name: 'Roman clay', detail: 'Soft mineral plaster', background: texture('roman-clay')},
  {id: 'rock-wall', name: '3D rock wall', detail: 'Dark dimensional stone look', background: texture('rock-wall')},
  {id: 'wallpaper', name: 'Wallpaper', detail: 'Botanical pattern', background: texture('wallpaper')},
  {id: 'coffee-shop-graphic', name: 'Coffee shop wall graphic', detail: 'Commercial printed graphic', background: texture('coffee-shop-graphic')},
  {id: 'linen', name: 'Linen texture', detail: 'Woven wallcovering look', background: texture('linen')},
  {id: 'residential-wrap', name: 'Residential wall wrap', detail: 'Printed wave design', background: texture('residential-wrap')},
  {id: 'wainscoting', name: 'Wainscoting', detail: 'Raised panel look', background: texture('wainscoting')},
  {id: 'paint-trim', name: 'Paint & trim', detail: 'Two colors with a trim line', background: texture('paint-trim')},
];

// Shared 22s clock (matches animation-duration in the CSS): each finish reveals every 1.8s, the last one holds, then everything resets.
const LOOP = 22, STEP = 1.8, LEAD = 0.5, REVEAL = 0.6, LAST = FINISHES.length - 1;
const pct = (seconds: number) => `${(seconds / LOOP * 100).toFixed(2)}%`;
const start = (i: number) => LEAD + i * STEP;
const KEYFRAMES = FINISHES.map((_, i) => {
  const a = start(i), shown = i === LAST ? LOOP * 0.94 : start(i + 1), gone = i === LAST ? LOOP * 0.98 : start(i + 1) + 0.25;
  const reveal = (name: string, hidden: string) => `@keyframes ${name}-${i}{0%,${pct(a)}{transform:${hidden};opacity:1;animation-timing-function:cubic-bezier(.75,0,.25,1)}${pct(a + REVEAL)},94%{transform:none;opacity:1}98%,100%{transform:none;opacity:0}}`;
  return reveal('wwt-swipe', 'translateX(-101%)') + reveal('wwt-roll', 'translateY(-101%)')
    + `@keyframes wwt-label-${i}{0%,${pct(a + 0.3)}{opacity:0;transform:translateY(8px)}${pct(a + 0.6)},${pct(shown)}{opacity:1;transform:none}${pct(gone)},100%{opacity:0;transform:translateY(-8px)}}`
    + `@keyframes wwt-seg-${i}{0%,${pct(a)}{transform:scaleX(0)}${pct(shown)},94%{transform:scaleX(1)}98%,100%{transform:scaleX(0)}}`;
}).join('');
const anim = (name: string, i: number): CSSProperties => ({animationName: `${name}-${i}`});

function Scene({mode, lighting, reference = false}: {mode: 'swipe' | 'roll'; lighting: boolean; reference?: boolean}) {
  return <div className={`wwt-scene wwt-${mode}`}>
    <img className="wwt-room" src="/images/wall-wrap/living-room.webp" alt="Illustrative living room concept with the feature wall changing finishes"/>
    <div className="wwt-wall" aria-hidden="true">
      {FINISHES.map((finish, i) => <div key={finish.id} className={`wwt-wrap${i === LAST ? ' wwt-wrap-final' : ''}`} style={{background: finish.background, ...anim(`wwt-${mode}`, i)}}/>)}
      {lighting && <div className="wwt-light"/>}
    </div>
    <img className="wwt-sectional" src="/images/wall-wrap/sectional.webp" alt=""/>
    <img className="wwt-plant" src="/images/wall-wrap/plant.webp" alt=""/>
    {reference && <img className="wwt-reference" src="/images/wall-wrap/reference.webp" alt=""/>}
  </div>;
}

export function WallWrapTest() {
  const [paused, setPaused] = useState(false);
  const [lighting, setLighting] = useState(true);
  const [reference, setReference] = useState(false);
  const [run, setRun] = useState(0);
  return <main className={`wwt${paused ? ' is-paused' : ''}`}>
    <style dangerouslySetInnerHTML={{__html: KEYFRAMES}}/>
    <div className="wwt-bar">
      <div><p className="wwt-kicker">Animation test</p><h1>Wall wrap samples</h1></div>
      <nav aria-label="Samples"><a href="#sample-1">1 · Room reveal</a><a href="#sample-2">2 · Text overlay</a><a href="#sample-3">3 · Finish showcase</a></nav>
      <div className="wwt-controls">
        <button type="button" onClick={() => setPaused(value => !value)}>{paused ? 'Play' : 'Pause'}</button>
        <button type="button" onClick={() => { setPaused(false); setRun(value => value + 1); }}>Replay</button>
        <label><input type="checkbox" checked={lighting} onChange={e => setLighting(e.target.checked)}/> Room lighting on wrap</label>
      </div>
    </div>
    <div key={run}>
      <section id="sample-1" className="wwt-sample">
        <header className="wwt-sample-head">
          <div><h2>Sample 1 · Room reveal</h2><p>Each finish swipes across the wall behind the furniture.</p></div>
          <label className="wwt-inline"><input type="checkbox" checked={reference} onChange={e => setReference(e.target.checked)}/> Overlay reference (50%)</label>
        </header>
        <div className="wwt-frame is-landscape"><Scene mode="swipe" lighting={lighting} reference={reference}/></div>
        <ol className="wwt-finishes" aria-label="Finishes in reveal order">
          {FINISHES.map(finish => <li key={finish.id}><i style={{background: finish.background}}/>{finish.name}</li>)}
        </ol>
      </section>

      <section id="sample-2" className="wwt-sample">
        <header className="wwt-sample-head"><div><h2>Sample 2 · Text overlay</h2><p>Login-panel layout inspired by CMI, with a lighter shade so the wall stays visible.</p></div></header>
        <div className="wwt-frame is-panel">
          <Scene mode="swipe" lighting={lighting}/>
          <div className="wwt-cmi-shade"/>
          <div className="wwt-cmi">
            <span className="wwt-badge"><i/>LayeredFX · Scottsdale, Arizona</span>
            <div className="wwt-cmi-copy">
              <blockquote>“Beautiful surfaces. Spaces with a little more soul.”</blockquote>
              <b>Wraps, decorative finishes, window film and paint</b>
              <span>Residential &amp; commercial</span>
              <p className="wwt-now" aria-hidden="true">{FINISHES.map((finish, i) => <em key={finish.id} style={anim('wwt-label', i)}>Now showing · {finish.name}</em>)}</p>
            </div>
            <div className="wwt-stats">
              <div><b>Wall wraps</b><span>Graphics, color &amp; texture</span></div>
              <div><b>Decorative finishes</b><span>Roman clay, concrete &amp; more</span></div>
              <div><b>Your next step</b><span>Book a consultation</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="sample-3" className="wwt-sample">
        <header className="wwt-sample-head"><div><h2>Sample 3 · Finish showcase</h2><p>Finishes roll down like a hung wrap, with a finish card and progress.</p></div></header>
        <div className="wwt-frame is-landscape">
          <Scene mode="roll" lighting={lighting}/>
          <div className="wwt-showcase-shade"/>
          <div className="wwt-card" aria-hidden="true">
            <div className="wwt-card-swatch">{FINISHES.map((finish, i) => <i key={finish.id} style={{background: finish.background, ...anim('wwt-label', i)}}/>)}</div>
            <div className="wwt-card-names">{FINISHES.map((finish, i) => <div key={finish.id} style={anim('wwt-label', i)}><small>Finish {String(i + 1).padStart(2, '0')} / {String(FINISHES.length).padStart(2, '0')}</small><b>{finish.name}</b><span>{finish.detail}</span></div>)}</div>
            <div className="wwt-card-progress" style={{gridTemplateColumns: `repeat(${FINISHES.length},1fr)`}}>{FINISHES.map((finish, i) => <span key={finish.id}><i style={anim('wwt-seg', i)}/></span>)}</div>
          </div>
          <a className="wwt-cta" href="/book">Book a consultation ↗</a>
        </div>
      </section>
    </div>
  </main>;
}
