import {OperationError} from '@/lib/operations/engine.mjs';
import {checkOrigin, errorResponse} from '@/lib/operations/server';
import {readBody} from '@/lib/operations/security.mjs';
import {checkFiles, contentMatches, LOG_LIMITS, parseDraft, parsePatch} from '@/lib/jobs/logs-model';
import {createLog, deleteLog, listLogs, logsActor, requireWriter, updateLog, type UploadFile} from '@/lib/jobs/logs-server';
export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'private, no-store', Vary: 'Cookie'};

export async function GET(request: Request) {
  try {
    await logsActor();
    const job = new URL(request.url).searchParams.get('job') || undefined;
    return Response.json({logs: await listLogs(job)}, {headers});
  } catch (e) { return errorResponse(e); }
}

/** Multipart: a `payload` JSON field plus `files` (one recording for a voice note, 1–20 photos for a photo log). */
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const actor = await logsActor();
    requireWriter(actor);
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) throw new OperationError('Send the daily log as a form upload.', 415);
    if (Number(request.headers.get('content-length') || 0) > LOG_LIMITS.requestBytes) throw new OperationError('This daily log is too large. Add fewer photos per log.', 413);
    let form: FormData;
    try { form = await request.formData(); } catch { throw new OperationError('The upload could not be read. Try again.', 400); }
    let raw: unknown;
    try { raw = JSON.parse(String(form.get('payload') || '')); } catch { throw new OperationError('Invalid daily log.', 400); }
    const draft = parseDraft(raw);
    const blobs = form.getAll('files').filter((f): f is File => f instanceof File);
    checkFiles(draft.kind, blobs);
    const files: UploadFile[] = [];
    for (const f of blobs) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (!contentMatches(f.type, bytes)) throw new OperationError(`${f.name || 'A file'} does not match its file type.`, 400);
      files.push({type: f.type, name: f.name, bytes});
    }
    return Response.json({log: await createLog(actor, draft, files)}, {status: 201, headers});
  } catch (e) { return errorResponse(e); }
}

export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const actor = await logsActor();
    requireWriter(actor);
    let body: Record<string, unknown>;
    try { body = JSON.parse(await readBody(request, 512000)); } catch (e) { if (e instanceof OperationError) throw e; throw new OperationError('Invalid request.', 400); }
    if (typeof body.id !== 'string' || !Number.isInteger(body.revision)) throw new OperationError('Invalid request.', 400);
    const log = await updateLog(actor, body.id, body.revision as number, current => parsePatch(current.kind, (body.patch || {}) as Record<string, unknown>));
    return Response.json({log}, {headers});
  } catch (e) { return errorResponse(e); }
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const actor = await logsActor();
    requireWriter(actor);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new OperationError('Invalid request.', 400);
    await deleteLog(actor, id);
    return Response.json({ok: true}, {headers});
  } catch (e) { return errorResponse(e); }
}
