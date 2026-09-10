import type {Actor,Command,Deal,Document,OperationState,Plan,Stage,StageGuide,StageItem} from './types';
export {PATH,STAGES,OPEN,DEFAULT_STAGES} from './defaults.mjs';
export class OperationError extends Error {status:number;constructor(message:string,status?:number)}
export function uid(prefix?:string):string;
export function today(now?:Date):string;
export function validDate(value:unknown,required?:boolean):string;
export function offsetDate(date:string,offset:number):string;
export function emptyState():OperationState;
export function demoState():OperationState;
export function applyCommand(state:OperationState,command:Command,actor:Actor,at?:string):{state:OperationState;resultId:string|null};
export function visibleState(state:OperationState,actor:Actor):OperationState;
export function access(record:Document|Plan|undefined,actor:Actor,kind?:'document'|'plan'):{view:boolean;edit:boolean;manage:boolean};
export function guideFor(state:OperationState,deal:Deal,stage?:Stage):StageGuide;
export function stepsFor(state:OperationState,deal:Deal,stage?:Stage):(StageItem&{automatic:boolean;done:boolean})[];
export function blockingSteps(state:OperationState,deal:Deal,stage?:Stage):StageItem[];
export function needsNextStep(deal:Deal,date?:string):boolean;
export function stageDays(deal:Deal,now?:Date):number;
export function stats(deals:Deal[]):{openCount:number;openValue:number;weighted:number;wonValue:number;winRate:number};
export function plainText(nodes:unknown):string;
