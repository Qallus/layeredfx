import type {Contact} from './types';
export function emailKey(v:unknown):string;
export function phoneKey(v:unknown):string;
export function matchingContacts(contacts:Contact[],draft:Partial<Contact>,excludeId?:string):Contact[];
