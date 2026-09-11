import {PortalAuth} from '@/components/portal/auth';
import {portalDemo} from '@/lib/portal/server';
export default function Page(){return <PortalAuth demo={portalDemo()}/>;}
