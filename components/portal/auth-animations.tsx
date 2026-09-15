// Story-panel animations for the portal login, register and password screens.
// `wall-wrap` is the active animation. `layered-plates` is the original "Layered products + designs =
// Layered FX" animation, kept intact (markup here, styles in portal.css) so it can be switched back.
import type {CSSProperties} from 'react';

export type AuthAnimation='wall-wrap'|'layered-plates';
export const AUTH_ANIMATION:AuthAnimation='wall-wrap';

export function AuthStoryAnimation({variant=AUTH_ANIMATION}:{variant?:AuthAnimation}){
 return variant==='layered-plates'?<LayeredPlatesAnimation/>:<WallWrapAnimation/>;
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
