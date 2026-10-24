// The consent form's decision. Same-origin only, re-validated in full, and tied to the signed-in member.
import {checkOrigin} from '@/lib/operations/server';
import {approver, checkRequest, pageOrigin} from '@/lib/mcp/consent';
import {issueGrant} from '@/lib/mcp/store';
import {CODE_TTL, withParams} from '@/lib/mcp/oauth.mjs';

export const dynamic = 'force-dynamic';
const see = (location: string) => new Response(null, {status: 303, headers: {Location: location, 'Cache-Control': 'no-store'}});
const page = (message: string, status: number) => new Response(message, {status, headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'}});

export async function POST(request: Request) {
  // Sec-Fetch-Site is set by the browser and cannot be forged by a page; it covers browsers or extensions that
  // send `Origin: null` for this form.
  try { checkOrigin(request); } catch { if (request.headers.get('sec-fetch-site') !== 'same-origin') return page('This request origin is not allowed.', 403); }
  const form = await request.formData();
  const params = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')) as Record<string, string>;
  const origin = await pageOrigin();
  const {check} = await checkRequest(params, origin);
  if ('fatal' in check) return page(check.fatal, 400);
  if ('error' in check) return see(withParams(check.redirect, {error: check.error, error_description: check.error_description, state: check.state}));
  const actor = await approver();
  if (actor === 401 || actor === 403) return page('Sign in to LayeredFX with a team account, then try connecting again.', 401);
  if (params.decision !== 'approve') return see(withParams(check.ok.redirect, {error: 'access_denied', error_description: 'The LayeredFX member declined.', state: check.ok.state}));
  const code = await issueGrant({kind: 'code', userId: actor.id, clientId: check.ok.clientId, ttl: CODE_TTL, challenge: check.ok.challenge, redirectUri: check.ok.redirect});
  return see(withParams(check.ok.redirect, {code: code.secret, state: check.ok.state, iss: origin}));
}
