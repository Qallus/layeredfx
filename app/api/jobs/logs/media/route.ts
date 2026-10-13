import {OperationError} from '@/lib/operations/engine.mjs';
import {errorResponse} from '@/lib/operations/server';
import {logsActor, mediaFor} from '@/lib/jobs/logs-server';
export const dynamic = 'force-dynamic';

/** Opens one daily log photo or recording for a signed-in member: a short-lived signed URL live, the file in demo mode. */
export async function GET(request: Request) {
  try {
    await logsActor();
    const params = new URL(request.url).searchParams, log = params.get('log'), media = params.get('media');
    if (!log || !media) throw new OperationError('Invalid request.', 400);
    const file = await mediaFor(log, media);
    if (file.url) return Response.redirect(file.url, 302);
    return new Response(file.bytes as BodyInit, {headers: {'Content-Type': file.type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'}});
  } catch (e) { return errorResponse(e); }
}
