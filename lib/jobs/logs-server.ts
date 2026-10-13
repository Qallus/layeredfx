import 'server-only';
// Job Daily Logs persistence. Local development (demo mode) uses a file store under .local-data; live mode uses the
// lfx_job_logs table and the private lfx-job-log-media bucket through the service role. Every query is scoped to the
// organization, and a log can only be attached to a job that exists in the operations record.
import {mkdir, open, readFile, rename, rm, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {OperationError} from '@/lib/operations/engine.mjs';
import {configured, currentActor, mode, readState} from '@/lib/operations/server';
import {isUuid} from '@/lib/operations/security.mjs';
import type {Actor} from '@/lib/operations/types';
import {baseMime, canChange, type JobLog, type LogDraft, type LogKind, type LogMedia, LOG_LIMITS} from './logs-model';

export const BUCKET = 'lfx-job-log-media';
const DEMO_ACTOR: Actor = {id: 'demo_owner', name: 'Demo Owner', role: 'admin', email: 'owner@example.test'};
export type UploadFile = {type: string; name: string; bytes: Uint8Array};
const notFound = () => new OperationError('Daily log not found.', 404);

/** The signed-in member; demo mode uses the same synthetic owner as the demo dashboard. */
export async function logsActor(): Promise<Actor> { return mode() === 'demo' ? DEMO_ACTOR : currentActor(); }
export function requireWriter(actor: Actor) { if (actor.role === 'viewer') throw new OperationError('Staff access required to add daily logs.', 403); }

/** Confirms the job exists and is active. Demo jobs live in the browser, so demo mode trusts the submitted name. */
async function jobName(jobId: string, submitted: string) {
  if (mode() === 'demo') return submitted || 'Demo job';
  const job = (await readState()).jobs?.find(j => j.id === jobId);
  if (!job) throw new OperationError('That job no longer exists. Reload and choose another job.', 404);
  if (job.archivedAt) throw new OperationError('Restore the job before adding daily logs.', 400);
  return job.name;
}

// ── Local development store ─────────────────────────────────────────────────────

const root = () => path.join(process.cwd(), '.local-data');
const localFile = () => path.join(root(), 'job-logs.json');
const localMedia = (logId: string, mediaId: string) => path.join(root(), 'job-log-media', logId, mediaId);
async function readLocal(): Promise<{logs: JobLog[]}> {
  try { return JSON.parse(await readFile(localFile(), 'utf8')); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {logs: []}; throw e; }
}
async function mutateLocal<T>(change: (store: {logs: JobLog[]}) => T): Promise<T> {
  await mkdir(root(), {recursive: true});
  let lock;
  try { lock = await open(localFile() + '.lock', 'wx'); } catch { throw new OperationError('Another daily log is saving. Please try again.', 409); }
  try {
    const store = await readLocal();
    const result = change(store);
    await writeFile(localFile() + '.tmp', JSON.stringify(store));
    await rename(localFile() + '.tmp', localFile());
    return result;
  } finally { await lock.close(); await unlink(localFile() + '.lock'); }
}

// ── LayeredFX Supabase store ────────────────────────────────────────────────────

function live() {
  const org = process.env.LFX_OPERATIONS_ORG_ID;
  if (!configured() || !isUuid(org)) throw new OperationError('Daily logs are not configured. Follow docs/channel-cast/SETUP.md.', 503);
  const client = createClient(process.env.LFX_SUPABASE_URL!, process.env.LFX_SUPABASE_SERVICE_ROLE_KEY!, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}});
  return {client, org: org as string};
}
const unavailable = () => new OperationError('Daily log storage is unavailable. Apply the job logs migration and check the private media bucket.', 503);
type Row = {id: string; job_id: string; job_name: string; kind: LogKind; log_date: string; title: string; content: unknown[]; body: string; transcript_source: 'device' | null; media: (LogMedia & {path: string})[]; created_by: string; created_by_name: string; created_at: string; updated_at: string; revision: number};
const COLUMNS = 'id,job_id,job_name,kind,log_date,title,content,body,transcript_source,media,created_by,created_by_name,created_at,updated_at,revision';
const fromRow = (r: Row): JobLog => ({id: r.id, jobId: r.job_id, jobName: r.job_name, kind: r.kind, logDate: r.log_date, title: r.title, content: r.content, body: r.body, transcriptSource: r.transcript_source, media: r.media.map(({id, type, size, name}) => ({id, type, size, name})), createdBy: r.created_by, createdByName: r.created_by_name, createdAt: r.created_at, updatedAt: r.updated_at, revision: r.revision});
async function liveRow(id: string) {
  if (!isUuid(id)) throw notFound();
  const {client, org} = live();
  const {data, error} = await client.from('lfx_job_logs').select(COLUMNS).eq('org_id', org).eq('id', id).maybeSingle();
  if (error) throw unavailable();
  if (!data) throw notFound();
  return data as unknown as Row;
}

// ── Operations ──────────────────────────────────────────────────────────────────

export async function listLogs(jobId?: string): Promise<JobLog[]> {
  if (jobId && !/^job_[0-9a-f-]{36}$/i.test(jobId)) throw new OperationError('Invalid job.', 400);
  if (mode() === 'demo') return (await readLocal()).logs.filter(l => !jobId || l.jobId === jobId).sort((a, b) => b.logDate.localeCompare(a.logDate) || b.createdAt.localeCompare(a.createdAt)).slice(0, LOG_LIMITS.listLimit);
  const {client, org} = live();
  let query = client.from('lfx_job_logs').select(COLUMNS).eq('org_id', org);
  if (jobId) query = query.eq('job_id', jobId);
  const {data, error} = await query.order('log_date', {ascending: false}).order('created_at', {ascending: false}).limit(LOG_LIMITS.listLimit);
  if (error) throw unavailable();
  return (data as unknown as Row[]).map(fromRow);
}

/** Stores the files first, then the log; if saving the log fails, the uploaded files are removed again. */
export async function createLog(actor: Actor, draft: LogDraft, files: UploadFile[]): Promise<JobLog> {
  requireWriter(actor);
  const name = await jobName(draft.jobId, draft.jobName);
  const id = crypto.randomUUID(), now = new Date().toISOString();
  const media = files.map(f => ({id: crypto.randomUUID(), type: baseMime(f.type), size: f.bytes.byteLength, name: f.name.slice(0, 180) || 'file'}));
  const log: JobLog = {id, jobId: draft.jobId, jobName: name, kind: draft.kind, logDate: draft.logDate, title: draft.title, content: draft.content, body: draft.body, transcriptSource: draft.transcriptSource, media, createdBy: actor.id, createdByName: actor.name, createdAt: now, updatedAt: now, revision: 1};
  if (mode() === 'demo') {
    try {
      for (const [i, f] of files.entries()) { await mkdir(path.dirname(localMedia(id, media[i].id)), {recursive: true}); await writeFile(localMedia(id, media[i].id), f.bytes); }
      await mutateLocal(store => { store.logs.push(log); });
    } catch (e) { await rm(path.join(root(), 'job-log-media', id), {recursive: true, force: true}); throw e; }
    return log;
  }
  const {client, org} = live();
  const storage = client.storage.from(BUCKET), paths: string[] = [];
  try {
    for (const [i, f] of files.entries()) {
      const objectPath = `${org}/${draft.jobId}/${id}/${media[i].id}`;
      const {error} = await storage.upload(objectPath, f.bytes, {contentType: media[i].type, upsert: false});
      if (error) throw unavailable();
      paths.push(objectPath);
    }
    const {error} = await client.from('lfx_job_logs').insert({org_id: org, id, job_id: log.jobId, job_name: log.jobName, kind: log.kind, log_date: log.logDate, title: log.title, content: log.content, body: log.body, transcript_source: log.transcriptSource, media: media.map((m, i) => ({...m, path: paths[i]})), created_by: actor.id, created_by_name: actor.name, created_at: now, updated_at: now, revision: 1});
    if (error) throw unavailable();
    return log;
  } catch (e) { if (paths.length) await storage.remove(paths); throw e; }
}

/** Compare-and-swap on the log's revision: a stale edit is rejected, never silently overwritten. */
export async function updateLog(actor: Actor, id: string, revision: number, change: (log: JobLog) => Partial<JobLog>): Promise<JobLog> {
  const stale = () => new OperationError('Someone else changed this daily log. Reload before editing.', 409);
  const apply = (log: JobLog) => {
    if (!canChange(log, actor)) throw new OperationError('Only the author or an administrator can edit this daily log.', 403);
    if (log.revision !== revision) throw stale();
    return {...log, ...change(log), updatedAt: new Date().toISOString(), revision: log.revision + 1};
  };
  if (mode() === 'demo') return mutateLocal(store => { const i = store.logs.findIndex(l => l.id === id); if (i < 0) throw notFound(); store.logs[i] = apply(store.logs[i]); return store.logs[i]; });
  const row = await liveRow(id), next = apply(fromRow(row));
  const {client, org} = live();
  const {data, error} = await client.from('lfx_job_logs').update({title: next.title, content: next.content, body: next.body, log_date: next.logDate, updated_at: next.updatedAt, revision: next.revision}).eq('org_id', org).eq('id', id).eq('revision', revision).select('id');
  if (error) throw unavailable();
  if (!data?.length) throw stale();
  return next;
}

export async function deleteLog(actor: Actor, id: string): Promise<void> {
  if (mode() === 'demo') {
    await mutateLocal(store => { const log = store.logs.find(l => l.id === id); if (!log) throw notFound(); if (!canChange(log, actor)) throw new OperationError('Only the author or an administrator can delete this daily log.', 403); store.logs = store.logs.filter(l => l.id !== id); });
    await rm(path.join(root(), 'job-log-media', id), {recursive: true, force: true});
    return;
  }
  const row = await liveRow(id);
  if (!canChange(fromRow(row), actor)) throw new OperationError('Only the author or an administrator can delete this daily log.', 403);
  const {client, org} = live();
  const {error} = await client.from('lfx_job_logs').delete().eq('org_id', org).eq('id', id);
  if (error) throw unavailable();
  if (row.media.length) await client.storage.from(BUCKET).remove(row.media.map(m => m.path));
}

/** Demo mode returns the bytes; live mode returns a 60-second signed URL to the private object. */
export async function mediaFor(logId: string, mediaId: string): Promise<{type: string; bytes?: Uint8Array; url?: string}> {
  if (mode() === 'demo') {
    const log = (await readLocal()).logs.find(l => l.id === logId), item = log?.media.find(m => m.id === mediaId);
    if (!log || !item) throw new OperationError('File not found.', 404);
    return {type: item.type, bytes: new Uint8Array(await readFile(localMedia(logId, mediaId)))};
  }
  const row = await liveRow(logId), item = row.media.find(m => m.id === mediaId);
  if (!item) throw new OperationError('File not found.', 404);
  const {data, error} = await live().client.storage.from(BUCKET).createSignedUrl(item.path, 60);
  if (error || !data) throw unavailable();
  return {type: item.type, url: data.signedUrl};
}
