import {publicNotices} from '@/lib/topbar/server';
export async function GET(){try{return Response.json((await publicNotices()).map(({message,link,linkLabel,id})=>({message,link,linkLabel,id})),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json([],{headers:{'Cache-Control':'no-store'}});}}
