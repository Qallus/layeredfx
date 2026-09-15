"use client";
// Photorealistic wall-wrap test. Layer order: room photo → wrap swipes clipped by the wall mask (with the
// room's own wall lighting blended on top) → sectional cutout → plant cutout. Positions are pixel offsets
// measured against docs/images/house_couch_coffee_table.png, expressed as percentages of the 2526×1422 room.
import {useState, type CSSProperties} from 'react';
import './wall-wrap-test.css';

// Wrap finishes in swipe order; the last one is the finished wall (the navy from the supplied composite).
const FINISHES = [
  {name: 'Volt green', color: '#aedb22'},
  {name: 'Coastal blue', color: '#2e7cc4'},
  {name: 'Ember', color: '#ff6b2c'},
  {name: 'Slate', color: '#47536b'},
  {name: 'Midnight navy', color: '#141925'},
];

export function WallWrapTest() {
  const [paused, setPaused] = useState(false);
  const [lighting, setLighting] = useState(true);
  const [reference, setReference] = useState(false);
  const [run, setRun] = useState(0);
  return <main className="wwt">
    <header className="wwt-head">
      <div>
        <p className="wwt-kicker">Animation test</p>
        <h1>Wall wrap</h1>
        <p>Room photo, wrap swipes clipped by the wall mask, then the sectional and plant layered in front. Illustrative concept.</p>
      </div>
      <div className="wwt-controls">
        <button type="button" onClick={() => setPaused(value => !value)}>{paused ? 'Play' : 'Pause'}</button>
        <button type="button" onClick={() => { setPaused(false); setRun(value => value + 1); }}>Replay</button>
        <label><input type="checkbox" checked={lighting} onChange={e => setLighting(e.target.checked)}/> Room lighting on wrap</label>
        <label><input type="checkbox" checked={reference} onChange={e => setReference(e.target.checked)}/> Overlay reference (50%)</label>
      </div>
    </header>
    <div key={run} className={`wwt-scene${paused ? ' is-paused' : ''}`}>
      <img className="wwt-room" src="/images/wall-wrap/living-room.webp" alt="Illustrative living room concept with a feature wall being wrapped in different finishes"/>
      <div className="wwt-wall" aria-hidden="true">
        {FINISHES.map((finish, i) => <div key={finish.name} className={`wwt-wrap wwt-wrap-${i + 1}`} style={{'--wrap': finish.color} as CSSProperties}/>)}
        {lighting && <div className="wwt-light"/>}
      </div>
      <img className="wwt-sectional" src="/images/wall-wrap/sectional.webp" alt=""/>
      <img className="wwt-plant" src="/images/wall-wrap/plant.webp" alt=""/>
      {reference && <img className="wwt-reference" src="/images/wall-wrap/reference.webp" alt=""/>}
    </div>
    <ol className="wwt-finishes" aria-label="Finishes in swipe order">
      {FINISHES.map(finish => <li key={finish.name}><i style={{background: finish.color}}/>{finish.name}</li>)}
    </ol>
  </main>;
}
