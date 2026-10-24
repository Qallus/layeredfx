// LayeredFX MCP endpoint (Streamable HTTP, stateless JSON responses). Every request needs an OAuth access token
// issued by /api/oauth/token after a member approved the connection; the member's current role decides the tools.
import {readBody} from '@/lib/operations/security.mjs';
import {OperationError} from '@/lib/operations/engine.mjs';
import {findAccess} from '@/lib/mcp/store';
import {memberActor, resourceMetadataUrl, siteOrigin} from '@/lib/mcp/http';
import {handleMessage} from '@/lib/mcp/protocol';
import {toolsFor} from '@/lib/mcp/tools';
import type {Actor} from '@/lib/operations/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;
const attempts = new Map<string, {start: number; count: number}>();

function unauthorized(request: Request, description: string) {
  return Response.json({error: 'invalid_token', error_description: description}, {status: 401, headers: {
    'WWW-Authenticate': `Bearer resource_metadata="${resourceMetadataUrl(siteOrigin(request))}", error="invalid_token", error_description="${description}"`, 'Cache-Control': 'no-store'}});
}
function throttle(actor: Actor) {
  const now = Date.now();
  for (const [key, value] of attempts) if (now - value.start > 60000) attempts.delete(key);
  const bucket = attempts.get(actor.id) || {start: now, count: 0};
  if (bucket.count >= 120) throw new OperationError('Too many LayeredFX requests. Wait a minute.', 429);
  bucket.count++;
  attempts.set(actor.id, bucket);
}

/** Claude connects server to server without an Origin header; a browser on another site is refused. */
function originAllowed(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { const host = new URL(origin).hostname; return origin === siteOrigin(request) || ['claude.ai', 'claude.com'].some(h => host === h || host.endsWith(`.${h}`)); } catch { return false; }
}

export async function POST(request: Request) {
  if (!originAllowed(request)) return Response.json({jsonrpc: '2.0', id: null, error: {code: -32000, message: 'This origin is not allowed.'}}, {status: 403});
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1] || '';
  let actor: Actor;
  try {
    const grant = token ? await findAccess(token) : null;
    if (!grant) return unauthorized(request, token ? 'The access token is invalid or expired.' : 'Sign in to LayeredFX to use this connector.');
    actor = await memberActor(grant.userId);
    throttle(actor);
  } catch (e) {
    if (e instanceof OperationError && e.status === 401) return unauthorized(request, e.message);
    const status = e instanceof OperationError ? e.status : 503;
    return Response.json({jsonrpc: '2.0', id: null, error: {code: -32000, message: e instanceof OperationError ? e.message : 'LayeredFX is unavailable.'}}, {status});
  }
  let message: unknown;
  try { message = JSON.parse(await readBody(request, 1_000_000)); } catch { return Response.json({jsonrpc: '2.0', id: null, error: {code: -32700, message: 'Parse error.'}}, {status: 400}); }
  const tools = toolsFor(actor);
  if (Array.isArray(message)) {
    const replies = (await Promise.all(message.slice(0, 20).map(m => handleMessage(m, actor, tools)))).filter(Boolean);
    return replies.length ? Response.json(replies, {headers: {'Cache-Control': 'no-store'}}) : new Response(null, {status: 202});
  }
  const result = await handleMessage(message as Record<string, unknown>, actor, tools);
  return result ? Response.json(result, {headers: {'Cache-Control': 'no-store'}}) : new Response(null, {status: 202});
}

// No server-to-client stream and no sessions: GET and DELETE are not offered (Streamable HTTP allows 405).
export function GET() { return new Response(null, {status: 405, headers: {Allow: 'POST'}}); }
export function DELETE() { return new Response(null, {status: 405, headers: {Allow: 'POST'}}); }
