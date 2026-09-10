"use client";
import {setSourceRuntime} from "@/lib/dashboard/source-runtime";
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {applyCommand,demoState,visibleState} from '@/lib/operations/engine.mjs';
import type {Actor,Command,OperationState} from '@/lib/operations/types';
const KEY='layeredfx:operations:v2';
let refreshing:Promise<boolean>|null=null;
async function liveFetch(input:string,init?:RequestInit){let res=await fetch(input,init);if(res.status===401){refreshing ||= fetch('/api/operations/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.ok).finally(()=>{refreshing=null;});if(await refreshing)res=await fetch(input,init);}return res;}

type Context={state:OperationState;actor:Actor;mode:'demo'|'supabase';busy:boolean;error:string;notice:string;dispatch:(c:Command)=>Promise<string|null>;reload:()=>Promise<void>;clearError:()=>void};
const Store=createContext<Context|null>(null);
export function OperationsProvider({mode,actor:initialActor,children}:{mode:'demo'|'supabase';actor:Actor;children:React.ReactNode}){
 const [state,setState]=useState<OperationState|null>(null);const [actor,setActor]=useState(initialActor);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const current=useRef<OperationState|null>(null);const lock=useRef(false);
 const accept=useCallback((s:OperationState)=>{current.current=s;setState(s);},[]);
 const reload=useCallback(async()=>{try{if(mode==='demo'){const saved=localStorage.getItem(KEY);const s=saved?JSON.parse(saved) as OperationState:demoState();if(s.schemaVersion!==2)throw new Error('Saved demo uses an incompatible schema. Export it before resetting.');if(!saved)localStorage.setItem(KEY,JSON.stringify(s));accept(s);}else{const res=await liveFetch('/api/operations',{cache:'no-store'});const data=await res.json();if(!res.ok)throw new Error(data.message||'Could not load operations.');accept(data.state);setActor(data.actor);}setError('');}catch(e){setError(e instanceof Error?e.message:'Load failed.');}},[mode,accept]);
 useEffect(()=>{void reload();const onStorage=(e:StorageEvent)=>{if(e.key===KEY&&mode==='demo')void reload();};window.addEventListener('storage',onStorage);return()=>window.removeEventListener('storage',onStorage);},[reload,mode]);
 const dispatch=useCallback(async(c:Command)=>{
  if(lock.current||!current.current)return null;lock.current=true;setBusy(true);setError('');
  try{let resultId:string|null=null;if(mode==='demo'){
   const raw=localStorage.getItem(KEY);const persisted=raw?JSON.parse(raw) as OperationState:null;
   if(persisted&&persisted.revision!==current.current.revision)throw new Error('Another tab changed the demo. Reload before saving.');
   const result=applyCommand(current.current,c,actor);localStorage.setItem(KEY,JSON.stringify(result.state));accept(result.state);resultId=result.resultId;
  }else{const res=await liveFetch('/api/operations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:current.current.revision,command:c})});const data=await res.json();if(!res.ok)throw new Error(data.message||'The change was not saved.');accept(data.state);resultId=data.resultId;}
  setNotice('Saved');return resultId||'saved';
  }catch(e){setError(e instanceof Error?e.message:'The change was not saved.');return null;}finally{lock.current=false;setBusy(false);}
 },[actor,mode,accept]);
 if(!state)return <div className="ops-loader"><h1>LayeredFX operations</h1><p>{error||'Loading your workspace…'}</p>{error&&<button onClick={()=>void reload()}>Retry</button>}</div>;
 setSourceRuntime({state:visibleState(state,actor),actor,mode});
 return <Store.Provider value={{state:visibleState(state,actor),actor,mode,busy,error,notice,dispatch,reload,clearError:()=>setError('')}}>{children}</Store.Provider>;
}
export function useOperations(){const c=useContext(Store);if(!c)throw new Error('OperationsProvider is missing.');return c;}
