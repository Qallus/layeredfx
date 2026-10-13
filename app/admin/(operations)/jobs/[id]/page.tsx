import {JobDetail} from '@/components/operations/jobs';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <JobDetail id={id}/>;}
