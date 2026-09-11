'use client';
import {useEffect,useState} from 'react';
type PublicNotice={id:string;message:string;link:string;linkLabel:string};
export function TopBar(){const [notices,setNotices]=useState<PublicNotice[]>([]);useEffect(()=>{let active=true;async function refresh(){try{const r=await fetch('/api/topbar',{cache:'no-store'});if(r.ok&&active)setNotices(await r.json());}catch{}}void refresh();const timer=setInterval(refresh,30000);return()=>{active=false;clearInterval(timer);};},[]);const notice=notices[0];return <div className="lfx-topbar">{notice?<><span>{notice.message}</span>{notice.link&&<a href={notice.link}>{notice.linkLabel||'Learn more'}</a>}</>:<><span>Beautiful spaces start at the surface.</span><span>Residential / Commercial</span></>}</div>}
