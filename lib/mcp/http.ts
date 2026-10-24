import 'server-only';
// Addresses and discovery documents for the MCP OAuth flow. Production always uses NEXT_PUBLIC_SITE_URL, because
// behind the proxy the request URL is an internal address; development uses the address being browsed.
import {mode, people} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import type {Actor} from '@/lib/operations/types';
import {SCOPE} from './oauth.mjs';

export function siteOrigin(request: Request) {
  return process.env.NODE_ENV === 'development' ? new URL(request.url).origin : new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://layeredfx.com').origin;
}
export const resourceUrl = (origin: string) => `${origin}/api/mcp`;
export const resourceMetadataUrl = (origin: string) => `${origin}/.well-known/oauth-protected-resource/api/mcp`;

export const protectedResource = (origin: string) => ({resource: resourceUrl(origin), authorization_servers: [origin], scopes_supported: [SCOPE], bearer_methods_supported: ['header'], resource_name: 'LayeredFX Operations'});
export const authorizationServer = (origin: string) => ({
  issuer: origin, authorization_endpoint: `${origin}/oauth/authorize`, token_endpoint: `${origin}/api/oauth/token`, registration_endpoint: `${origin}/api/oauth/register`,
  response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'], code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none'], scopes_supported: [SCOPE], service_documentation: `${origin}/admin/profile`,
});

/** The member a grant belongs to, if still an active LayeredFX member (roles are read fresh on every use). */
export async function memberActor(userId: string): Promise<Actor> {
  if (mode() === 'demo') return {id: 'demo_owner', name: 'Demo Owner', role: 'admin'};
  const member = (await people()).find(p => p.id === userId);
  if (!member) throw new OperationError('This LayeredFX member is no longer active.', 401);
  return member;
}

export const oauthError = (error: string, description: string, status = 400) =>
  Response.json({error, error_description: description}, {status, headers: {'Cache-Control': 'no-store', Pragma: 'no-cache'}});
