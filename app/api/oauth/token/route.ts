// OAuth token endpoint: exchanges a single-use authorization code (with its PKCE verifier) or rotates a refresh
// token. Membership is re-checked on every exchange, so removing someone from the team ends their connections.
import {readBody} from '@/lib/operations/security.mjs';
import {getClient, issueGrant, redeem, revokeFamily} from '@/lib/mcp/store';
import {memberActor, oauthError} from '@/lib/mcp/http';
import {ACCESS_TTL, REFRESH_TTL, SCOPE, verifyPkce} from '@/lib/mcp/oauth.mjs';

export const dynamic = 'force-dynamic';

async function params(request: Request): Promise<Record<string, string>> {
  const raw = await readBody(request, 20000);
  if ((request.headers.get('content-type') || '').includes('application/json')) {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

async function tokens(userId: string, clientId: string, family: string, connectedAt: string) {
  const access = await issueGrant({kind: 'access', userId, clientId, family, connectedAt, ttl: ACCESS_TTL});
  const refresh = await issueGrant({kind: 'refresh', userId, clientId, family, connectedAt, ttl: REFRESH_TTL});
  return Response.json({access_token: access.secret, token_type: 'Bearer', expires_in: Math.floor(ACCESS_TTL / 1000), refresh_token: refresh.secret, scope: SCOPE},
    {headers: {'Cache-Control': 'no-store', Pragma: 'no-cache'}});
}

export async function POST(request: Request) {
  let p: Record<string, string>;
  try { p = await params(request); } catch { return oauthError('invalid_request', 'Could not read the token request.'); }
  try {
    const client = await getClient(p.client_id || '');
    if (!client) return oauthError('invalid_client', 'Unknown client.', 401);
    if (p.grant_type === 'authorization_code') {
      const grant = await redeem(p.code || '', 'code');
      if (!grant || grant.clientId !== client.id) return oauthError('invalid_grant', 'The authorization code is invalid, expired or already used.');
      if (grant.redirectUri !== p.redirect_uri) { await revokeFamily(grant.family); return oauthError('invalid_grant', 'redirect_uri does not match the authorization request.'); }
      if (!verifyPkce(p.code_verifier, grant.challenge)) { await revokeFamily(grant.family); return oauthError('invalid_grant', 'PKCE verification failed.'); }
      await memberActor(grant.userId);
      return tokens(grant.userId, client.id, grant.family, grant.connectedAt);
    }
    if (p.grant_type === 'refresh_token') {
      const grant = await redeem(p.refresh_token || '', 'refresh');
      if (!grant || grant.clientId !== client.id) return oauthError('invalid_grant', 'The refresh token is invalid, expired or revoked. Reconnect LayeredFX in Claude.');
      await memberActor(grant.userId);
      return tokens(grant.userId, client.id, grant.family, grant.connectedAt);
    }
    return oauthError('unsupported_grant_type', 'Use authorization_code or refresh_token.');
  } catch {
    return oauthError('invalid_grant', 'The grant could not be confirmed. Reconnect LayeredFX in Claude.');
  }
}
