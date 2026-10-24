import 'server-only';
// Storage for MCP OAuth clients and grants. Secrets are stored only as SHA-256 hashes. Production uses the
// LayeredFX Supabase project (supabase/migrations/20261023_layeredfx_mcp_oauth.sql) through the service role;
// the local development demo keeps everything in process memory.
import {randomUUID} from 'node:crypto';
import {db, mode, orgId} from '@/lib/operations/server';
import {hashSecret, newSecret, type OAuthClient} from './oauth.mjs';

export type GrantKind = 'code' | 'access' | 'refresh';
export type Grant = {kind: GrantKind; userId: string; clientId: string; family: string; connectedAt: string; challenge: string; redirectUri: string; expiresAt: string; revokedAt: string | null};
export type Connection = {family: string; clientName: string; connectedAt: string; lastRefreshed: string};
type Row = {kind: GrantKind; user_id: string; client_id: string; family: string; connected_at: string; code_challenge: string | null; redirect_uri: string | null; expires_at: string; revoked_at: string | null};

const PREFIX: Record<GrantKind, string> = {code: 'lfx_code', access: 'lfx_at', refresh: 'lfx_rt'};
const fromRow = (r: Row): Grant => ({kind: r.kind, userId: r.user_id, clientId: r.client_id, family: r.family, connectedAt: r.connected_at, challenge: r.code_challenge || '', redirectUri: r.redirect_uri || '', expiresAt: r.expires_at, revokedAt: r.revoked_at});
const live = (g: Grant, now = Date.now()) => !g.revokedAt && Date.parse(g.expiresAt) > now;

// ── Development demo: in-memory ─────────────────────────────────────────────────
type Memory = {clients: Map<string, OAuthClient>; grants: Map<string, Grant & {createdAt: string}>};
const memory = (): Memory => ((globalThis as {__lfxMcp?: Memory}).__lfxMcp ||= {clients: new Map(), grants: new Map()});
const demo = () => mode() === 'demo';
const json = (body: unknown) => ({body: JSON.stringify(body), headers: {Prefer: 'return=representation'}});

export async function registerClient(input: {name: string; redirectUris: string[]}): Promise<OAuthClient> {
  const client = {id: `mcp_${randomUUID()}`, name: input.name, redirectUris: input.redirectUris};
  if (demo()) { memory().clients.set(client.id, client); return client; }
  await db('lfx_mcp_clients', {method: 'POST', ...json({id: client.id, org_id: orgId(), name: client.name, redirect_uris: client.redirectUris})});
  return client;
}

export async function getClient(id: string): Promise<OAuthClient | null> {
  if (!/^mcp_[0-9a-f-]{36}$/.test(id)) return null;
  if (demo()) return memory().clients.get(id) || null;
  const rows = await (await db(`lfx_mcp_clients?org_id=eq.${orgId()}&id=eq.${id}&select=id,name,redirect_uris`)).json() as {id: string; name: string; redirect_uris: string[]}[];
  return rows[0] ? {id: rows[0].id, name: rows[0].name, redirectUris: rows[0].redirect_uris} : null;
}

/** Creates a grant and returns its secret. The secret is never stored or retrievable again. */
export async function issueGrant(input: {kind: GrantKind; userId: string; clientId: string; family?: string; connectedAt?: string; ttl: number; challenge?: string; redirectUri?: string}): Promise<{secret: string; family: string; expiresAt: string}> {
  const secret = newSecret(PREFIX[input.kind]), family = input.family || randomUUID(), now = new Date();
  const grant: Grant = {kind: input.kind, userId: input.userId, clientId: input.clientId, family, connectedAt: input.connectedAt || now.toISOString(), challenge: input.challenge || '', redirectUri: input.redirectUri || '', expiresAt: new Date(now.getTime() + input.ttl).toISOString(), revokedAt: null};
  if (demo()) memory().grants.set(hashSecret(secret), {...grant, createdAt: now.toISOString()});
  else await db('lfx_mcp_grants', {method: 'POST', ...json({org_id: orgId(), token_hash: hashSecret(secret), kind: grant.kind, user_id: grant.userId, client_id: grant.clientId, family, connected_at: grant.connectedAt, code_challenge: grant.challenge || null, redirect_uri: grant.redirectUri || null, expires_at: grant.expiresAt})});
  return {secret, family, expiresAt: grant.expiresAt};
}

/** A live access token's grant, or null. */
export async function findAccess(secret: string): Promise<Grant | null> {
  if (!secret.startsWith('lfx_at_')) return null;
  const hash = hashSecret(secret);
  if (demo()) { const g = memory().grants.get(hash); return g && g.kind === 'access' && live(g) ? g : null; }
  const rows = await (await db(`lfx_mcp_grants?org_id=eq.${orgId()}&token_hash=eq.${hash}&kind=eq.access&select=*`)).json() as Row[];
  const g = rows[0] ? fromRow(rows[0]) : null;
  return g && live(g) ? g : null;
}

/**
 * Single use for codes and refresh tokens: the grant is revoked as it is redeemed. Presenting one that was already
 * used revokes its whole family, because only a leaked copy would be replayed (OAuth 2.1 refresh token rotation).
 */
export async function redeem(secret: string, kind: 'code' | 'refresh'): Promise<Grant | null> {
  if (!secret.startsWith(`${PREFIX[kind]}_`)) return null;
  const hash = hashSecret(secret), at = new Date().toISOString();
  if (demo()) {
    const g = memory().grants.get(hash);
    if (!g || g.kind !== kind) return null;
    if (g.revokedAt) { await revokeFamily(g.family); return null; }
    g.revokedAt = at;
    return Date.parse(g.expiresAt) > Date.now() ? g : null;
  }
  const updated = await (await db(`lfx_mcp_grants?org_id=eq.${orgId()}&token_hash=eq.${hash}&kind=eq.${kind}&revoked_at=is.null`, {method: 'PATCH', ...json({revoked_at: at})})).json() as Row[];
  if (updated[0]) { const g = fromRow(updated[0]); return Date.parse(g.expiresAt) > Date.now() ? g : null; }
  const replay = await (await db(`lfx_mcp_grants?org_id=eq.${orgId()}&token_hash=eq.${hash}&kind=eq.${kind}&select=family`)).json() as {family: string}[];
  if (replay[0]) await revokeFamily(replay[0].family);
  return null;
}

/** Disconnects one Claude connection: every code, access and refresh token issued from the same approval. */
export async function revokeFamily(family: string, userId?: string) {
  const at = new Date().toISOString();
  if (demo()) { for (const g of memory().grants.values()) if (g.family === family && (!userId || g.userId === userId) && !g.revokedAt) g.revokedAt = at; return; }
  await db(`lfx_mcp_grants?org_id=eq.${orgId()}&family=eq.${family}${userId ? `&user_id=eq.${userId}` : ''}&revoked_at=is.null`, {method: 'PATCH', body: JSON.stringify({revoked_at: at})});
}

/** A member's active connections: approvals that still hold a usable refresh token. */
export async function listConnections(userId: string): Promise<Connection[]> {
  const now = Date.now();
  if (demo()) {
    const out = new Map<string, Connection>();
    for (const g of memory().grants.values()) if (g.kind === 'refresh' && g.userId === userId && live(g, now))
      out.set(g.family, {family: g.family, clientName: memory().clients.get(g.clientId)?.name || 'MCP client', connectedAt: g.connectedAt, lastRefreshed: g.createdAt});
    return [...out.values()];
  }
  const rows = await (await db(`lfx_mcp_grants?org_id=eq.${orgId()}&user_id=eq.${userId}&kind=eq.refresh&revoked_at=is.null&expires_at=gt.${new Date(now).toISOString()}&select=family,connected_at,created_at,lfx_mcp_clients(name)&order=created_at.desc`)).json() as {family: string; connected_at: string; created_at: string; lfx_mcp_clients: {name: string} | null}[];
  return rows.map(r => ({family: r.family, clientName: r.lfx_mcp_clients?.name || 'MCP client', connectedAt: r.connected_at, lastRefreshed: r.created_at}));
}
