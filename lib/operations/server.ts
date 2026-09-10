import 'server-only';
// Server-only boundary. This module must never be imported by a client component.
import { cookies } from 'next/headers';
import { OperationError, emptyState } from './engine.mjs';
import { assertSameOrigin, isUuid, verifyRevision } from './security.mjs';
import type { Actor, OperationState } from './types';
export const ACCESS_COOKIE = 'lfx_ops_access';
export const REFRESH_COOKIE = 'lfx_ops_refresh';
export const mode = () => process.env.NODE_ENV === 'development' && process.env.LFX_OPERATIONS_MODE !== 'supabase' ? 'demo' : 'supabase';
export function configured() { return Boolean(process.env.LFX_SUPABASE_URL && process.env.LFX_SUPABASE_ANON_KEY && process.env.LFX_SUPABASE_SERVICE_ROLE_KEY && process.env.LFX_OPERATIONS_ORG_ID); }
function config() { if (!configured())
    throw new OperationError('LayeredFX operations is not configured. Follow docs/channel-cast/SETUP.md.', 503); const url = new URL(process.env.LFX_SUPABASE_URL!); if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production')
    throw new OperationError('Use HTTPS for the LayeredFX database connection.', 503); const org = process.env.LFX_OPERATIONS_ORG_ID!; if (!isUuid(org))
    throw new OperationError('LFX_OPERATIONS_ORG_ID must be a UUID.', 503); return { url: url.origin, anon: process.env.LFX_SUPABASE_ANON_KEY!, service: process.env.LFX_SUPABASE_SERVICE_ROLE_KEY!, org }; }
export function checkOrigin(request: Request) { const primary = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://layeredfx.com').origin; const allowed = [primary, ...(process.env.LFX_ALLOWED_ORIGINS || '').split(',').filter(Boolean).map(x => new URL(x.trim()).origin)]; if (process.env.NODE_ENV === 'development')
    allowed.push('http://localhost:3000', 'http://127.0.0.1:3000'); assertSameOrigin(request.headers.get('origin'), allowed); }
async function db(path: string, init: RequestInit = {}) { const c = config(); const res = await fetch(`${c.url}/rest/v1/${path}`, { ...init, headers: { apikey: c.service, Authorization: `Bearer ${c.service}`, 'Content-Type': 'application/json', ...init.headers }, cache: 'no-store', signal: AbortSignal.timeout(12000) }); if (!res.ok)
    throw new OperationError('LayeredFX database request failed. Verify the migration and server configuration.', 503); return res; }
export async function people() { const c = config(); const res = await db(`lfx_ops_members?org_id=eq.${c.org}&active=eq.true&select=user_id,display_name,email,role`); const rows = await res.json() as {
    user_id: string;
    display_name: string;
    email: string;
    role: Actor['role'];
}[]; return rows.map(r => ({ id: r.user_id, name: r.display_name, email: r.email, role: r.role })); }
export async function actorForToken(token: string): Promise<Actor> { const c = config(); const response = await fetch(`${c.url}/auth/v1/user`, { headers: { apikey: c.anon, Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) }); if (!response.ok)
    throw new OperationError('Your session has expired. Sign in again.', 401); const user = await response.json(); if (!isUuid(user.id))
    throw new OperationError('Invalid session.', 401); const member = (await people()).find(p => p.id === user.id); if (!member)
    throw new OperationError('This user is not an active LayeredFX operations member.', 403); return member; }
export async function currentActor() { const jar = await cookies(); const token = jar.get(ACCESS_COOKIE)?.value; if (!token)
    throw new OperationError('Sign in required.', 401); return actorForToken(token); }
export async function readState(): Promise<OperationState> { const c = config(); const res = await db(`lfx_ops_store?org_id=eq.${c.org}&select=state,revision`); const rows = await res.json() as {
    state: OperationState;
    revision: number;
}[]; let state: OperationState; if (!rows.length) {
    state = emptyState();
    await db('lfx_ops_store?on_conflict=org_id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ org_id: c.org, revision: 0, state }) });
    const latest = await db(`lfx_ops_store?org_id=eq.${c.org}&select=state,revision`);
    const seeded = await latest.json() as {
        state: OperationState;
        revision: number;
    }[];
    state = seeded[0]?.state || state;
}
else {
    state = rows[0].state;
    verifyRevision(state.revision, rows[0].revision);
} if (state.schemaVersion !== 2)
    throw new OperationError('Unsupported data version. No data has been changed.', 409); state.people = await people(); return state; }
export async function writeState(state: OperationState, expected: number) { const c = config(); const res = await db(`lfx_ops_store?org_id=eq.${c.org}&revision=eq.${expected}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ state, revision: state.revision, updated_at: new Date().toISOString() }) }); const updated = await res.json() as unknown[]; if (!updated.length)
    verifyRevision(-1, expected); }
export async function authTokens(grant: 'password' | 'refresh_token', body: Record<string, string>) { const c = config(); const res = await fetch(`${c.url}/auth/v1/token?grant_type=${grant}`, { method: 'POST', headers: { apikey: c.anon, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(12000) }); if (!res.ok)
    throw new OperationError('Sign-in failed. Check your credentials or sign in again.', 401); const tokens = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}; if (!tokens.access_token || !tokens.refresh_token)
    throw new OperationError('Authentication response was invalid.', 502); await actorForToken(tokens.access_token); return tokens; }
export async function saveTokens(tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}) { const jar = await cookies(); const options = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' }; jar.set(ACCESS_COOKIE, tokens.access_token, { ...options, maxAge: Math.min(tokens.expires_in || 3600, 86400) }); jar.set(REFRESH_COOKIE, tokens.refresh_token, { ...options, maxAge: 7 * 86400 }); }
export async function clearTokens() { const jar = await cookies(); jar.delete(ACCESS_COOKIE); jar.delete(REFRESH_COOKIE); }
export function errorResponse(error: unknown) { const status = error instanceof OperationError ? error.status : 500; const message = error instanceof OperationError ? error.message : 'The request failed. No success was confirmed; reload before retrying.'; return Response.json({ message }, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
