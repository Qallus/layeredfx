import {readBody} from '@/lib/operations/security.mjs';
import {checkOrigin,currentActor,errorResponse,mode,readState,writeState,people} from '@/lib/operations/server';
import {currentPortal} from '@/lib/portal/server';
import {applyCommand,OperationError} from '@/lib/operations/engine.mjs';
import {readFile,mkdir,open,writeFile,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
const file=()=>path.join(process.cwd(),'.local-data','studio-requests.json');
async function local(){try{return JSON.parse(await readFile(file(),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e;}}
export async function GET(){try{if(mode()!=='demo'){await currentActor();return Response.json({items:[]});}return Response.json({items:await local()},{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{checkOrigin(request);const body=JSON.parse(await readBody(request,24000));if(!body||typeof body.id!=='string'||!/^[a-f0-9-]{36}$/i.test(body.id)||!body.details||typeof body.details.name!=='string'||!body.details.name.trim()||typeof body.details.email!=='string'||!/^\S+@\S+\.\S+$/.test(body.details.email)||!Array.isArray(body.walls)||body.walls.length>20)throw new OperationError('Enter your name, email and wall measurements.',400);const item={...body,createdAt:new Date().toISOString()};
if(mode()==='demo'){await mkdir(path.dirname(file()),{recursive:true});let lock;try{lock=await open(file()+'.lock','wx');}catch{throw new OperationError('Another request is saving. Please try again.',409);}try{const items=await local();if(!items.some((i:{id:string})=>i.id===item.id)){if(items.length>=1000)throw new OperationError('The local request inbox is full.',503);items.push(item);await writeFile(file()+'.tmp',JSON.stringify(items));await rename(file()+'.tmp',file());}}finally{await lock.close();await unlink(file()+'.lock');}}
else{const account=await currentPortal();const members=await people(),owner=members.find(m=>m.id===process.env.LFX_STUDIO_LEAD_OWNER_ID&&m.role!=='viewer');if(!owner)throw new OperationError('Studio lead assignment is not configured. Please contact the team.',503);const state=await readState();const result=applyCommand(state,{type:'studio.import',project:{...item,portalUserId:account.user_id}},owner);await writeState(result.state,state.revision);}
return Response.json({id:item.id,saved:true},{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
