import {PortalAuth} from '@/components/portal/auth';
import {portalDemo} from '@/lib/portal/server';
export const metadata={title:'Forgot password | LayeredFX'};
export default function Page(){return <PortalAuth mode="forgot" demo={portalDemo()}/>;}
