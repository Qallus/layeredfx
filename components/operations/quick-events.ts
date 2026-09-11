export type QuickTool='agent'|'dm'|'sms'|'dialpad'|'calls'|'notes'|'record';
export type QuickSeed={phone?:string;contactId?:string};
export function openQuickTool(tool:QuickTool,seed:QuickSeed={}){window.dispatchEvent(new CustomEvent('lfx:quick-tool',{detail:{tool,...seed}}));}
