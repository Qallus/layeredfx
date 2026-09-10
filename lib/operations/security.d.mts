import type {Command} from './types';
export function assertSameOrigin(origin:string|null,allowed:string[]):void;
export function parseCommandBody(raw:string):{revision:number;command:Command};
export function verifyRevision(actual:number,expected:number):void;
export function isUuid(value:unknown):boolean;
export function readBody(request:Request,limit?:number):Promise<string>;
