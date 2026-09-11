'use client';
import {WilsonartLibrary} from './wilsonart-library';
export function StudioLibrary({onSelect}:{onSelect:(name:string,finish:string,color:string,image?:string)=>void}){return <section className="ws-library"><h2>Materials</h2><WilsonartLibrary onSelect={onSelect}/></section>;}
