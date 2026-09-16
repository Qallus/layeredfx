import 'server-only';
// Outbound calls to the LayeredFX agent services: Hermes (Eve) and Paperclip agent teams.
// Keys are read here and never returned, logged or echoed; failures surface as OperationError with an honest
// message. Follows the provider pattern in lib/communications/email.ts and lib/bookings/server.ts.
import {OperationError} from '@/lib/operations/engine.mjs';
import type {Actor} from '@/lib/operations/types';

export type HermesReply = {id: string; text: string; model: string};
export type IssueResult = {id: string; url: string; confirmed: boolean};
export type Check = {name: string; ok: boolean; detail: string};
export type CallResult = {ok: boolean; status: number; data: unknown; timedOut: boolean};

const REPLY_LIMIT = 4000;
const trimUrl = (value: string | undefined) => (value || '').trim().replace(/\/$/, '');

export function hermesConfig() {
  const base = trimUrl(process.env.LFX_HERMES_URL), key = (process.env.LFX_HERMES_API_KEY || '').trim();
  if (!base || !key) throw new OperationError('Eve is not connected yet. Add the Hermes address and key to the LayeredFX environment.', 503);
  // Hermes reports a profile name as the model name, so this is normally the profile: eve.
  return {base, key, model: (process.env.LFX_HERMES_MODEL || '').trim() || 'eve'};
}
export function paperclipConfig() {
  const base = trimUrl(process.env.LFX_PAPERCLIP_URL), key = (process.env.LFX_PAPERCLIP_API_KEY || '').trim();
  const company = (process.env.LFX_PAPERCLIP_COMPANY_ID || '').trim();
  if (!base || !key || !company) throw new OperationError('Paperclip is not connected yet. Add the address, API key and company id to the LayeredFX environment.', 503);
  return {base, key, company, agent: (process.env.LFX_PAPERCLIP_AGENT_ID || '').trim()};
}
export const hermesReady = () => Boolean(trimUrl(process.env.LFX_HERMES_URL) && process.env.LFX_HERMES_API_KEY);
export const paperclipReady = () => Boolean(trimUrl(process.env.LFX_PAPERCLIP_URL) && process.env.LFX_PAPERCLIP_API_KEY && process.env.LFX_PAPERCLIP_COMPANY_ID);

/** One request. Returns the outcome instead of throwing, so callers can recover (see paperclipCreateIssue). */
async function call(base: string, path: string, key: string, init: RequestInit & {timeout: number}): Promise<CallResult> {
  const {timeout, headers, ...rest} = init;
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...rest, cache: 'no-store', signal: AbortSignal.timeout(timeout),
      headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...headers},
    });
  } catch {
    return {ok: false, status: 0, data: null, timedOut: true};
  }
  // Error bodies are never kept: they can repeat request details back to the client.
  if (!response.ok) return {ok: false, status: response.status, data: null, timedOut: false};
  return {ok: true, status: response.status, data: await response.json().catch(() => null), timedOut: false};
}

const seconds = (ms: number) => Math.round(ms / 1000);
function failureDetail(result: CallResult, timeout: number) {
  if (result.timedOut) return `No response within ${seconds(timeout)} seconds.`;
  if (result.status === 401 || result.status === 403) return 'HTTP ' + result.status + ' — the key was rejected.';
  if (result.status === 404) return 'HTTP 404 — the address was not found.';
  return `HTTP ${result.status}.`;
}
function providerError(service: string, result: CallResult, timeout: number) {
  if (result.timedOut) return new OperationError(`${service} did not respond within ${seconds(timeout)} seconds. Check before sending again.`, 502);
  if (result.status === 401 || result.status === 403) return new OperationError(`${service} rejected the API key. Check the key in the LayeredFX environment.`, 502);
  if (result.status === 404) return new OperationError(`${service} did not recognise the request address. Check the URL in the LayeredFX environment.`, 502);
  return new OperationError(`${service} did not confirm the request (HTTP ${result.status}). Check before sending again.`, 502);
}

// ── Hermes (Eve) ────────────────────────────────────────────────────────────────

export async function hermesChat(input: {system: string; prompt: string}): Promise<HermesReply> {
  const {base, key, model} = hermesConfig();
  const result = await call(base, '/v1/chat/completions', key, {
    method: 'POST', timeout: 20000,
    body: JSON.stringify({model, stream: false, messages: [{role: 'system', content: input.system}, {role: 'user', content: input.prompt}]}),
  });
  if (!result.ok) throw providerError('Eve', result, 20000);
  const data = (result.data || {}) as {id?: unknown; model?: unknown; choices?: {message?: {content?: unknown}}[]};
  const content = data.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content.trim().slice(0, REPLY_LIMIT) : '';
  if (!text) throw new OperationError('Eve answered without any content. Nothing was recorded.', 502);
  return {id: typeof data.id === 'string' ? data.id : '', text, model: typeof data.model === 'string' ? data.model : model};
}

const modelNames = (data: unknown) => {
  const rows = Array.isArray(data) ? data : Array.isArray((data as {data?: unknown[]})?.data) ? (data as {data: unknown[]}).data : [];
  return rows.flatMap(row => { const id = (row as {id?: unknown})?.id; return typeof id === 'string' ? [id] : []; });
};

export async function hermesHealth(): Promise<Check[]> {
  let config: ReturnType<typeof hermesConfig>;
  try { config = hermesConfig(); } catch (e) { return [{name: 'Configuration', ok: false, detail: e instanceof OperationError ? e.message : 'Not configured.'}]; }
  const health = await call(config.base, '/health', config.key, {method: 'GET', timeout: 8000});
  const models = await call(config.base, '/v1/models', config.key, {method: 'GET', timeout: 8000});
  const names = models.ok ? modelNames(models.data) : [];
  return [
    {name: 'Service', ok: health.ok, detail: health.ok ? 'Hermes answered.' : failureDetail(health, 8000)},
    {name: `Profile "${config.model}"`, ok: models.ok && names.includes(config.model),
      detail: !models.ok ? failureDetail(models, 8000) : names.length ? `Reported: ${names.slice(0, 6).join(', ')}` : 'No profiles reported.'},
  ];
}

// ── Paperclip agent teams ───────────────────────────────────────────────────────

/** Paperclip issue ids and links are not documented; accept id or key and fall back to a built link. */
function issueFrom(value: unknown, base: string): {id: string; url: string} | null {
  const row = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const inner = (row.issue && typeof row.issue === 'object' ? row.issue : row) as Record<string, unknown>;
  const id = typeof inner.key === 'string' && inner.key ? inner.key : typeof inner.id === 'string' ? inner.id : '';
  if (!id) return null;
  const url = typeof inner.url === 'string' && inner.url.startsWith('https://') ? inner.url : `${base}/issues/${encodeURIComponent(id)}`;
  return {id, url};
}
const issueRows = (data: unknown) => Array.isArray(data) ? data
  : Array.isArray((data as {issues?: unknown[]})?.issues) ? (data as {issues: unknown[]}).issues
  : Array.isArray((data as {data?: unknown[]})?.data) ? (data as {data: unknown[]}).data : [];

/** Looks for the marker in recent issues; the description may not be listed, so the title is checked too. */
async function findByMarker(base: string, key: string, company: string, marker: string) {
  const list = await call(base, `/api/companies/${encodeURIComponent(company)}/issues?limit=50`, key, {method: 'GET', timeout: 8000});
  if (!list.ok) return null;
  const match = issueRows(list.data).find(row => {
    const fields = row && typeof row === 'object' ? [(row as Record<string, unknown>).title, (row as Record<string, unknown>).description] : [];
    return fields.some(field => typeof field === 'string' && field.includes(marker));
  });
  return match ? issueFrom(match, base) : null;
}

/**
 * Creates a Paperclip task. Creation can answer HTTP 500 after saving, so a failure looks for the marker
 * instead of retrying: a retry would duplicate the task.
 */
export async function paperclipCreateIssue(input: {title: string; description: string; priority: 'critical' | 'high' | 'medium' | 'low'; marker: string}): Promise<IssueResult> {
  const {base, key, company, agent} = paperclipConfig();
  const result = await call(base, `/api/companies/${encodeURIComponent(company)}/issues`, key, {
    method: 'POST', timeout: 15000,
    body: JSON.stringify({title: input.title, description: `${input.description}\n\n${input.marker}`, status: 'todo', priority: input.priority, ...(agent ? {assigneeAgentId: agent} : {})}),
  });
  if (result.ok) {
    const issue = issueFrom(result.data, base);
    if (issue) return {...issue, confirmed: true};
  }
  const saved = await findByMarker(base, key, company, input.marker);
  if (saved) return {...saved, confirmed: false};
  if (result.ok) throw new OperationError('Paperclip accepted the task but did not return it. Check team.layeredfx.com before sending it again.', 502);
  throw providerError('Paperclip', result, 15000);
}

export async function paperclipAgents(): Promise<{id: string; name: string}[]> {
  const {base, key, company} = paperclipConfig();
  const result = await call(base, `/api/companies/${encodeURIComponent(company)}/agents`, key, {method: 'GET', timeout: 8000});
  if (!result.ok) throw providerError('Paperclip', result, 8000);
  const rows = Array.isArray(result.data) ? result.data : Array.isArray((result.data as {agents?: unknown[]})?.agents) ? (result.data as {agents: unknown[]}).agents : [];
  return rows.flatMap(row => {
    const item = (row || {}) as {id?: unknown; name?: unknown};
    return typeof item.id === 'string' ? [{id: item.id, name: typeof item.name === 'string' ? item.name : item.id}] : [];
  });
}

export async function paperclipHealth(): Promise<Check[]> {
  let config: ReturnType<typeof paperclipConfig>;
  try { config = paperclipConfig(); } catch (e) { return [{name: 'Configuration', ok: false, detail: e instanceof OperationError ? e.message : 'Not configured.'}]; }
  const result = await call(config.base, `/api/companies/${encodeURIComponent(config.company)}/agents`, config.key, {method: 'GET', timeout: 8000});
  if (!result.ok) return [{name: 'Company', ok: false, detail: failureDetail(result, 8000)}];
  const rows = Array.isArray(result.data) ? result.data : Array.isArray((result.data as {agents?: unknown[]})?.agents) ? (result.data as {agents: unknown[]}).agents : [];
  return [{name: 'Company', ok: true, detail: `${rows.length} ${rows.length === 1 ? 'agent' : 'agents'} visible.`}];
}

// ── Shared guards ───────────────────────────────────────────────────────────────

const attempts = new Map<string, {start: number; count: number}>();
/** Ten agent actions per member per minute, matching the communications limit. */
export function agentThrottle(actor: Actor) {
  const now = Date.now();
  for (const [key, value] of attempts) if (now - value.start > 60000) attempts.delete(key);
  const bucket = attempts.get(actor.id) || {start: now, count: 0};
  if (bucket.count >= 10) throw new OperationError('Please wait a minute before sending more agent work.', 429);
  bucket.count++;
  attempts.set(actor.id, bucket);
}
export function agentFailure(error: unknown) {
  if (error instanceof OperationError) return error;
  return new OperationError('The agent service did not confirm the request. Check before sending again.', 502);
}
