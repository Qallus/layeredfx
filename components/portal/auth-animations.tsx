// Story-panel animations for the portal login, register and password screens.
// `service-flip` is the active animation. `wall-wrap` and `layered-plates` (the original "Layered products +
// designs = Layered FX" animation) are kept intact (markup here, styles in portal.css) so they can be switched back.
import type {CSSProperties} from 'react';
import {services,type Service} from '@/lib/layeredfx/content';

export type AuthAnimation='service-flip'|'wall-wrap'|'layered-plates';
export const AUTH_ANIMATION:AuthAnimation='service-flip';

export function AuthStoryAnimation({variant=AUTH_ANIMATION}:{variant?:AuthAnimation}){
 if(variant==='layered-plates')return <LayeredPlatesAnimation/>;
 if(variant==='wall-wrap')return <WallWrapAnimation/>;
 return <ServiceFlipAnimation/>;
}

// Illustrative material swatch shown beside each service name (styles in portal.css).
const MATERIAL:Record<Service,string>={
 'Wall wraps':'graphic','Cabinet wraps':'oak','Countertop wraps':'marble','Appliance wraps':'steel','Wallpaper':'pattern',
 'Roman clay':'clay','Faux concrete overlays':'concrete','Epoxy':'epoxy','Window tint & film':'film','Interior painting':'paint-light','Exterior painting':'paint-dark',
};

/** Flips through every service with its material swatch, then settles on the app icon and LayeredFX.com. */
export function ServiceFlipAnimation(){
 return <div className="portal-flip-scene" aria-hidden="true" style={{'--count':services.length} as CSSProperties}>
  <div className="portal-flip-slot">
   {services.map((name,i)=><div key={name} className="portal-flip-item" style={{'--i':i} as CSSProperties}><span className={`portal-material portal-material-${MATERIAL[name]}`}/><span>{name}</span></div>)}
  </div>
  <div className="portal-flip-final">
   <img src="/brand/layeredfx_app_icon.svg" alt="" width={112} height={112}/>
   <span>LayeredFX.com</span>
  </div>
 </div>;
}

/** Original animation: product and design plates stack into the LayeredFX app icon. */
export function LayeredPlatesAnimation(){
 return <>
  <div className="portal-layers" aria-hidden="true">
   <div className="portal-plate portal-plate-product"/>
   <div className="portal-plate portal-plate-design"/>
   <div className="portal-plate portal-plate-result"><img src="/brand/layeredfx_app_icon.svg" alt="" width={72} height={72}/></div>
  </div>
  <ol className="portal-equation" aria-label="Layered products plus designs equals Layered FX"><li>Layered products</li><li aria-hidden="true">+</li><li>Designs</li><li aria-hidden="true">=</li><li>Layered FX</li></ol>
 </>;
}

// Wrap colors swipe across the wall in order; the last one is the finished color.
const WALL_WRAPS=['#47536b','#2e7cc4','#ff6b2c','#1f9d64','#d6ff41'];

/** A wall is wrapped in quick color swipes, a checkmark confirms the final color, then blurs into the app icon. */
export function WallWrapAnimation(){
 return <div className="portal-wall-scene" aria-hidden="true">
  <div className="portal-wall">
   {WALL_WRAPS.map((color,i)=><div key={color} className={`portal-wall-wrap portal-wall-wrap-${i+1}`} style={{'--wrap':color} as CSSProperties}/>)}
   <div className="portal-wall-shade"/>
   <div className="portal-wall-check"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29"/><path d="M19 33l9 9 17-19" pathLength={1}/></svg></div>
   <img className="portal-wall-icon" src="/brand/layeredfx_app_icon.svg" alt="" width={120} height={120}/>
  </div>
  <div className="portal-wall-floor"/>
 </div>;
}
