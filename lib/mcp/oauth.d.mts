export type OAuthClient={id:string;name:string;redirectUris:string[]};
export const SCOPE:string;
export const CODE_TTL:number;
export const ACCESS_TTL:number;
export const REFRESH_TTL:number;
export const DEFAULT_REDIRECT_HOSTS:string[];
export function newSecret(prefix:string):string;
export function hashSecret(secret:string):string;
export function verifyPkce(verifier:unknown,challenge:unknown):boolean;
export function redirectHosts(env?:Record<string,string|undefined>):string[];
export function allowedRedirect(raw:unknown,hosts?:string[]):boolean;
export function registration(body:unknown,hosts?:string[]):{client:{name:string;redirectUris:string[]}}|{error:string;error_description:string};
export function authorizeRequest(params:Record<string,unknown>|null|undefined,client:OAuthClient|null,resource:string):
 {fatal:string}|{error:string;error_description:string;redirect:string;state:string}|{ok:{clientId:string;redirect:string;state:string;challenge:string}};
export function withParams(base:string,params:Record<string,string|undefined>):string;
