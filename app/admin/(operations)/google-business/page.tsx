import {GoogleBusinessPage} from '@/components/operations/google-business';
import {servicePages} from '@/lib/layeredfx/service-pages';
export const metadata={title:'Google Business Profile'};
// Reads ALLOW_INDEXING at request time so the readiness checklist reflects the deployed setting.
export const dynamic='force-dynamic';
export default function Page(){return <GoogleBusinessPage services={servicePages.map(({name,slug})=>({name,slug}))} indexingEnabled={process.env.ALLOW_INDEXING==='true'}/>;}
