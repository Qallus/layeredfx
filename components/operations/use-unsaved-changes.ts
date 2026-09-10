"use client";
import {useEffect} from 'react';

export function useUnsavedChanges(dirty:boolean) {
  useEffect(()=>{
    if(!dirty)return;
    const beforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    const navigate=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      const link=event.target instanceof Element ? event.target.closest('a[href]') : null;
      if(!(link instanceof HTMLAnchorElement)||link.target==='_blank'||link.hasAttribute('download'))return;
      const target=new URL(link.href,window.location.href);
      if(target.pathname===location.pathname&&target.search===location.search&&target.origin===location.origin)return;
      if(!window.confirm('Leave without saving your changes?')){event.preventDefault();event.stopPropagation();}
    };
    window.addEventListener('beforeunload',beforeUnload);
    document.addEventListener('click',navigate,true);
    return()=>{window.removeEventListener('beforeunload',beforeUnload);document.removeEventListener('click',navigate,true);};
  },[dirty]);
}
