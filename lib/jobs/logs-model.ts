// Job Daily Logs: shared limits, types and validation used by the browser and the server.
import {contentCheck, OperationError, plainText, validDate} from '@/lib/operations/engine.mjs';

export const LOG_KINDS = ['note', 'voice', 'photo'] as const;
export type LogKind = typeof LOG_KINDS[number];
export const LOG_KIND_LABELS: Record<LogKind, string> = {note: 'Notes', voice: 'Voice note', photo: 'Photos'};
export const LOG_LIMITS = {maxPhotos: 20, photoBytes: 15 * 1024 * 1024, audioBytes: 25 * 1024 * 1024, requestBytes: 80 * 1024 * 1024, title: 200, body: 20000, listLimit: 300};
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const AUDIO_TYPES = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'];

export type LogMedia = {id: string; type: string; size: number; name: string};
export type JobLog = {
  id: string; jobId: string; jobName: string; kind: LogKind; logDate: string; title: string;
  /** Rich-text notes (editor blocks); empty for voice and photo logs. */
  content: unknown[];
  /** Plain text: note text for search, the voice transcript, or the photo caption. */
  body: string;
  /** Set only when a transcript was produced by the on-device speech model. */
  transcriptSource: 'device' | null;
  media: LogMedia[]; createdBy: string; createdByName: string; createdAt: string; updatedAt: string; revision: number;
};
export type LogDraft = Pick<JobLog, 'jobId' | 'kind' | 'logDate' | 'title' | 'content' | 'body' | 'transcriptSource'> & {jobName: string};

const fail = (message: string, status = 400): never => { throw new OperationError(message, status); };
const text = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';

/** Drops codec parameters (`audio/webm;codecs=opus` → `audio/webm`) and normalizes common aliases. */
export function baseMime(type: string) {
  const t = type.split(';')[0].trim().toLowerCase();
  return t === 'audio/x-m4a' || t === 'audio/m4a' ? 'audio/mp4' : t === 'audio/x-wav' || t === 'audio/wave' ? 'audio/wav' : t === 'image/jpg' ? 'image/jpeg' : t;
}
export const extensionFor = (type: string) => ({'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav'} as Record<string, string>)[baseMime(type)] || 'bin';

/** Checks the file's leading bytes so a renamed file cannot pass as a photo or recording. */
export function contentMatches(type: string, b: Uint8Array) {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  switch (baseMime(type)) {
    case 'image/jpeg': return b[0] === 0xff && b[1] === 0xd8;
    case 'image/png': return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v);
    case 'image/webp': return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    case 'audio/webm': return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
    case 'audio/mp4': return ascii(4, 8) === 'ftyp';
    case 'audio/mpeg': return ascii(0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
    case 'audio/ogg': return ascii(0, 4) === 'OggS';
    case 'audio/wav': return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE';
    default: return false;
  }
}

/** Validates the text part of a new log. Files are checked separately by checkFiles. */
export function parseDraft(raw: unknown): LogDraft {
  if (!raw || typeof raw !== 'object') fail('Invalid daily log.');
  const r = raw as Record<string, unknown>;
  const jobId = text(r.jobId, 80);
  if (!/^job_[0-9a-f-]{36}$/i.test(jobId)) fail('Choose a job for this daily log.');
  const kind = LOG_KINDS.includes(r.kind as LogKind) ? r.kind as LogKind : fail('Choose Notes, Voice note or Photos.');
  const content = kind === 'note' ? contentCheck(Array.isArray(r.content) ? r.content : []) : [];
  const body = kind === 'note' ? plainText(content).slice(0, LOG_LIMITS.body) : text(r.body, LOG_LIMITS.body);
  if (kind === 'note' && !body) fail('Write a note before saving.');
  return {
    jobId, kind, content, body, jobName: text(r.jobName, 200),
    logDate: validDate(r.logDate, true),
    title: text(r.title, LOG_LIMITS.title),
    transcriptSource: kind === 'voice' && r.transcriptSource === 'device' && body ? 'device' : null,
  };
}

/** Per-kind file rules: notes have no files, a voice note has one recording, a photo log has 1–20 photos. */
export function checkFiles(kind: LogKind, files: {type: string; size: number}[]) {
  if (kind === 'note' && files.length) fail('Notes do not take attachments. Use a Photos log for pictures.');
  if (kind === 'voice' && files.length !== 1) fail('Record or choose one audio file.');
  if (kind === 'photo' && (!files.length || files.length > LOG_LIMITS.maxPhotos)) fail(`Add between 1 and ${LOG_LIMITS.maxPhotos} photos.`);
  for (const f of files) {
    const type = baseMime(f.type);
    if (kind === 'voice' && !AUDIO_TYPES.includes(type)) fail('Use a WebM, M4A, MP3, OGG or WAV recording.');
    if (kind === 'photo' && !IMAGE_TYPES.includes(type)) fail('Use JPEG, PNG or WebP photos.');
    if (!f.size) fail('A file is empty.');
    if (f.size > (kind === 'voice' ? LOG_LIMITS.audioBytes : LOG_LIMITS.photoBytes)) fail(kind === 'voice' ? 'Recordings must be under 25 MB.' : 'Each photo must be under 15 MB.', 413);
  }
}

/** Fields a member may change after saving. Notes keep rich content; voice and photo logs edit their text. */
export function parsePatch(kind: LogKind, raw: Record<string, unknown>) {
  const out: Partial<Pick<JobLog, 'title' | 'content' | 'body' | 'logDate'>> = {};
  if ('title' in raw) out.title = text(raw.title, LOG_LIMITS.title);
  if ('logDate' in raw) out.logDate = validDate(raw.logDate, true);
  if (kind === 'note' && 'content' in raw) { out.content = contentCheck(raw.content); out.body = plainText(out.content).slice(0, LOG_LIMITS.body); if (!out.body) fail('A note cannot be empty.'); }
  if (kind !== 'note' && 'body' in raw) out.body = text(raw.body, LOG_LIMITS.body);
  return out;
}
export const canChange = (log: Pick<JobLog, 'createdBy'>, actor: {id: string; role: string}) => actor.role === 'admin' || (actor.role !== 'viewer' && log.createdBy === actor.id);
