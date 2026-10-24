// RFC 7591 dynamic client registration, limited to public PKCE clients whose redirect URIs are Claude's own
// addresses or a local loopback callback (LFX_MCP_REDIRECT_HOSTS adds hosts). Registering grants no access:
// a LayeredFX member still has to sign in and approve the app on the consent screen.
import {readBody} from '@/lib/operations/security.mjs';
import {registerClient} from '@/lib/mcp/store';
import {oauthError} from '@/lib/mcp/http';
import {redirectHosts, registration} from '@/lib/mcp/oauth.mjs';

export const dynamic = 'force-dynamic';
const recent = new Map<string, {start: number; count: number}>();

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown', now = Date.now();
  for (const [key, value] of recent) if (now - value.start > 3600000) recent.delete(key);
  const bucket = recent.get(ip) || {start: now, count: 0};
  if (++bucket.count > 20) return oauthError('temporarily_unavailable', 'Too many registrations. Try again later.', 429);
  recent.set(ip, bucket);
  let body: unknown;
  try { body = JSON.parse(await readBody(request, 10000)); } catch { return oauthError('invalid_client_metadata', 'Send the registration as JSON.'); }
  const result = registration(body, redirectHosts());
  if ('error' in result) return oauthError(result.error, result.error_description);
  try {
    const client = await registerClient(result.client);
    return Response.json({client_id: client.id, client_id_issued_at: Math.floor(now / 1000), client_name: client.name, redirect_uris: client.redirectUris,
      grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none'}, {status: 201, headers: {'Cache-Control': 'no-store'}});
  } catch {
    return oauthError('server_error', 'The app could not be registered. Try again later.', 503);
  }
}
