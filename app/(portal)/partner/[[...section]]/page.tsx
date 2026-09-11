import {redirect} from 'next/navigation';
import {PortalDashboard} from '@/components/portal/dashboard';
import {currentPortal,portalDemo} from '@/lib/portal/server';
import {initialPortal,isPartner,type PortalAccount} from '@/lib/portal/model';
export default async function Page({params}:{params:Promise<{section?:string[]}>}){const{section}=await params;const demo=portalDemo();let account:PortalAccount;if(demo)account={user_id:'partner-demo',org_id:'local',email:'partner@example.test',kind:'contractor',status:'active',revision:0,state:initialPortal('Sample Partner')};else{try{account=await currentPortal();}catch{redirect('/login');}if(!isPartner(account.kind))redirect('/portal');}return <PortalDashboard initial={account} demo={demo} section={section?.[0]}/>;}
