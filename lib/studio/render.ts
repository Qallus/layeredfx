import {projection,projectPoint,type Point} from './homography';
import {drawTexturedTriangle} from './triangle';
export type Mask={points:Point[];radius:number;polygon:boolean;restore:boolean};
export const finishes=[
 {id:'clay',name:'Warm Roman clay',category:'Roman clay',color:'#bba38b'},
 {id:'concrete',name:'Soft concrete',category:'Concrete',color:'#a8aaa3'},
 {id:'palm',name:'Botanical wallpaper',category:'Wallpaper',color:'#e1e8db'},
 {id:'arc',name:'Midnight arcs',category:'Wallpaper',color:'#243c56'},
 {id:'oak',name:'Natural oak',category:'Architectural wrap',color:'#ae855a'},
 {id:'film',name:'Frosted glass',category:'Window film',color:'#d4e1e2'},
];
export const defaultCorners:Point[]=[{x:.12,y:.12},{x:.8,y:.12},{x:.12,y:.8},{x:.8,y:.8}];
export function validQuad(p:Point[]){const order=[p[0],p[1],p[3],p[2]];return order.every((a,i)=>{const b=order[(i+1)%4],c=order[(i+2)%4];return (b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x)>.001;});}
function canvas(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
export function surface(id:string,scale:number,art:HTMLImageElement|null){
 const c=canvas(1000,1000),ctx=c.getContext('2d')!;
 if(id==='custom'&&art){ctx.drawImage(art,0,0,1000,1000);return c;}
 const f=finishes.find(f=>f.id===id)||finishes[0];ctx.fillStyle=f.color;ctx.fillRect(0,0,1000,1000);
 const size=scale;
 for(let y=0;y<1000;y+=size)for(let x=0;x<1000;x+=size){
  ctx.save();ctx.translate(x,y);ctx.lineWidth=2;ctx.strokeStyle=id==='arc'?'#cfb366':id==='palm'?'#53755a':'#fff2';
  if(id==='arc'){for(let r=15;r<size/2;r+=12){ctx.beginPath();ctx.arc(size/2,size*.7,r,Math.PI,0);ctx.stroke();}}
  else if(id==='palm'){ctx.beginPath();ctx.moveTo(size/2,size*.9);ctx.quadraticCurveTo(size*.25,size*.3,size/2,size*.1);ctx.quadraticCurveTo(size*.8,size*.4,size*.6,size*.6);ctx.moveTo(size/2,size*.1);ctx.lineTo(size*.4,size*.65);ctx.stroke();}
  else if(id==='oak'){for(let i=0;i<size;i+=9){ctx.beginPath();ctx.moveTo(i,0);ctx.bezierCurveTo(i+8,size/3,i-8,size*.7,i,size);ctx.stroke();}}
  else {for(let i=0;i<40;i++){const n=(x*31+y*13+i*7919)%997;ctx.fillStyle=i%2?'#fff0':'#00000008';ctx.beginPath();ctx.ellipse(n%size,(n*7)%size,size*.4,size*.06,i,0,Math.PI*2);ctx.fill();}}
  ctx.restore();
 }return c;
}
const projectedCache=new WeakMap<HTMLCanvasElement,{key:string;image:HTMLCanvasElement}>();
export function renderStudio(target:HTMLCanvasElement,photo:HTMLImageElement,corners:Point[],texture:HTMLCanvasElement|null,masks:Mask[],opacity:number,before:boolean,showMask=false){
 if(!texture)return;
 const w=target.width,h=target.height,ctx=target.getContext('2d')!;ctx.clearRect(0,0,w,h);ctx.drawImage(photo,0,0,w,h);if(before)return;
 const layer=canvas(w,h),lc=layer.getContext('2d')!,H=projection(1000,1000,corners.map(p=>({x:p.x*w,y:p.y*h})));
 if(!H.every(Number.isFinite))return;
 const cacheKey=JSON.stringify([w,h,corners]),cached=projectedCache.get(texture);
 if(cached?.key===cacheKey)lc.drawImage(cached.image,0,0);
 else {
 for(let row=0;row<20;row++)for(let col=0;col<20;col++){
  const x=col*50,y=row*50,a=projectPoint(H,x,y),b=projectPoint(H,x+50,y),c=projectPoint(H,x,y+50),d=projectPoint(H,x+50,y+50);
  drawTexturedTriangle(lc,texture,a.x,a.y,b.x,b.y,c.x,c.y,x,y,x+50,y,x,y+50);
  drawTexturedTriangle(lc,texture,b.x,b.y,d.x,d.y,c.x,c.y,x+50,y,x+50,y+50,x,y+50);
 }
 const saved=canvas(w,h);saved.getContext('2d')!.drawImage(layer,0,0);projectedCache.set(texture,{key:cacheKey,image:saved});
 }
 const mask=canvas(w,h),mc=mask.getContext('2d')!;
 for(const stroke of masks){if(!stroke.points.length)continue;mc.globalCompositeOperation=stroke.restore?'destination-out':'source-over';mc.fillStyle='#000';mc.strokeStyle='#000';mc.lineWidth=stroke.radius*w*2;mc.lineCap='round';mc.lineJoin='round';mc.beginPath();mc.moveTo(stroke.points[0].x*w,stroke.points[0].y*h);for(const p of stroke.points.slice(1))mc.lineTo(p.x*w,p.y*h);if(stroke.polygon){mc.closePath();mc.fill();}else{mc.stroke();if(stroke.points.length===1){mc.beginPath();mc.arc(stroke.points[0].x*w,stroke.points[0].y*h,stroke.radius*w,0,Math.PI*2);mc.fill();}}}
 lc.globalCompositeOperation='destination-out';lc.drawImage(mask,0,0);
 ctx.globalAlpha=opacity;ctx.globalCompositeOperation='multiply';ctx.drawImage(layer,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 if(showMask){mc.globalCompositeOperation='source-in';mc.fillStyle='#d6ff4166';mc.fillRect(0,0,w,h);ctx.drawImage(mask,0,0);}
}
