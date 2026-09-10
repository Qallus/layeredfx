import {DocumentPage} from '@/components/operations/workspace';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <DocumentPage id={id}/>;}
