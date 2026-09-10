import Link from 'next/link';
import {redirect} from 'next/navigation';
import {OperationsProvider} from '@/components/operations/provider';
import {OperationsShell} from '@/components/operations/shell';
import {OperationError} from '@/lib/operations/engine.mjs';
import {configured,currentActor,mode} from '@/lib/operations/server';
import type {Actor} from '@/lib/operations/types';
export const dynamic='force-dynamic';
export default async function ProtectedLayout({children}:{children:React.ReactNode}){
 const dataMode=mode();let actor:Actor={id:'demo_owner',name:'Demo Owner',role:'admin'};
 if(dataMode==='supabase'){
  if(!configured())return <div className="ops-login"><div className="ops-login-card"><h1>Operations is not configured.</h1><p>The public website remains available. Configure LayeredFX-only credentials using <code>docs/channel-cast/SETUP.md</code> to enable the protected dashboard.</p><Link href="/">Return to website</Link></div></div>;
  try{actor=await currentActor();}catch(e){if(e instanceof OperationError&&e.status===401)redirect('/admin/login');if(e instanceof OperationError&&e.status===403)return <div className="ops-login"><div className="ops-login-card"><h1>Access not enabled</h1><p>This user needs an active LayeredFX operations membership.</p><Link href="/admin/login">Sign in with another account</Link></div></div>;throw e;}
 }
 return <OperationsProvider mode={dataMode} actor={actor}><OperationsShell>{children}</OperationsShell></OperationsProvider>;
}
