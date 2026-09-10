import {OpportunityDetail} from '@/components/operations/pipeline';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <OpportunityDetail id={id}/>;}
