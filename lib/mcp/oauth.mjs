// OAuth 2.1 helpers for the LayeredFX MCP server (authorization code + PKCE S256, public clients, rotating refresh
// tokens). Pure functions only; storage is lib/mcp/store.ts and the HTTP endpoints live under app/api/oauth.
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';

export const SCOPE='lfx';
export const CODE_TTL=5*60*1000;
export const ACCESS_TTL=60*60*1000;
export const REFRESH_TTL=30*24*60*60*1000;
// Claude's hosted apps; Claude Code and local tools use an http loopback callback on any port.
export const DEFAULT_REDIRECT_HOSTS=['claude.ai','claude.com'];

const b64url=buf=>Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export function newSecret(prefix){return `${prefix}_${b64url(randomBytes(32))}`;}
export function hashSecret(secret){return createHash('sha256').update(String(secret)).digest('hex');}
/** RFC 7636 S256: BASE64URL(SHA256(verifier)) must equal the stored challenge. */
export function verifyPkce(verifier,challenge){
 if(typeof verifier!=='string'||!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)||typeof challenge!=='string'||!challenge)return false;
 const actual=Buffer.from(b64url(createHash('sha256').update(verifier).digest())),expected=Buffer.from(challenge);
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function redirectHosts(env=process.env){const extra=String(env.LFX_MCP_REDIRECT_HOSTS||'').split(',').map(h=>h.trim().toLowerCase()).filter(Boolean);return [...new Set([...DEFAULT_REDIRECT_HOSTS,...extra])];}
/** https on an allowed host (or its subdomain), or http on a loopback address. No fragments or credentials. */
export function allowedRedirect(raw,hosts=redirectHosts()){
 let url;try{url=new URL(String(raw));}catch{return false;}
 if(url.hash||url.username||url.password)return false;
 const host=url.hostname.toLowerCase();
 if(url.protocol==='http:')return host==='localhost'||host==='127.0.0.1'||host==='[::1]';
 return url.protocol==='https:'&&hosts.some(h=>host===h||host.endsWith(`.${h}`));
}
/** Dynamic client registration request (RFC 7591), reduced to what a public PKCE client needs. */
export function registration(body,hosts){
 const b=body&&typeof body==='object'?body:{};
 const uris=Array.isArray(b.redirect_uris)?b.redirect_uris.filter(u=>typeof u==='string'):[];
 if(!uris.length||uris.length>5)return {error:'invalid_redirect_uri',error_description:'Register between 1 and 5 redirect URIs.'};
 const bad=uris.find(u=>u.length>500||!allowedRedirect(u,hosts));
 if(bad)return {error:'invalid_redirect_uri',error_description:`Redirect URI not allowed for LayeredFX: ${String(bad).slice(0,200)}`};
 const method=b.token_endpoint_auth_method??'none';
 if(method!=='none')return {error:'invalid_client_metadata',error_description:'Only public clients (token_endpoint_auth_method "none") with PKCE are supported.'};
 const name=typeof b.client_name==='string'&&b.client_name.trim()?b.client_name.trim().slice(0,100):'MCP client';
 return {client:{name,redirectUris:uris}};
}
/** Authorization request checks that must pass before the consent screen is shown. */
export function authorizeRequest(params,client,resource){
 const p=k=>{const v=params?.[k];return typeof v==='string'?v:'';};
 if(!client)return {fatal:'This app is not registered with LayeredFX. Add the connector again from Claude.'};
 const redirect=p('redirect_uri');
 if(!client.redirectUris.includes(redirect))return {fatal:'The return address does not match the one this app registered.'};
 const fail=(error,error_description)=>({error,error_description,redirect,state:p('state')});
 if(p('response_type')!=='code')return fail('unsupported_response_type','Only the authorization code flow is supported.');
 if(!p('code_challenge')||p('code_challenge_method')!=='S256')return fail('invalid_request','PKCE with S256 is required.');
 if(p('resource')&&p('resource').replace(/\/$/,'')!==resource)return fail('invalid_target','This server only issues tokens for its own MCP endpoint.');
 const scopes=p('scope').split(' ').filter(Boolean);
 if(scopes.some(s=>s!==SCOPE))return fail('invalid_scope',`The only scope is "${SCOPE}".`);
 return {ok:{clientId:client.id,redirect,state:p('state'),challenge:p('code_challenge')}};
}
export function withParams(base,params){const url=new URL(base);for(const [k,v]of Object.entries(params))if(v)url.searchParams.set(k,v);return url.href;}
