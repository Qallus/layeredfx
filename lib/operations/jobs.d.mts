import type {Actor,Command,Job,JobStage,JobStageGuide,OperationState,StageItem} from './types';
export function jobLabel(state:OperationState,stage:JobStage):string;
export function jobGuide(state:OperationState,job:Job,stage?:JobStage):JobStageGuide;
export function jobSteps(state:OperationState,job:Job,stage?:JobStage):(StageItem&{automatic:boolean;autoDone:boolean;overridden:boolean;done:boolean})[];
export function jobBlocking(state:OperationState,job:Job,stage?:JobStage):StageItem[];
export function jobNeedsNext(job:Job,date?:string):boolean;
export function jobDays(job:Job,now?:Date):number;
export function jobCommand(state:OperationState,command:Command,actor:Actor,now:string):string|null;
