// Card image upload → isolated LayeredFX public bucket. Adapted from Channel Cast
// app/api/admin/uploads/route.ts with content sniffing and no bucket auto-creation.
import {createClient} from '@supabase/supabase-js';
import {checkOrigin, configured, errorResponse, mode} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {requireCardWriter} from '@/lib/business-cards/model';
import {cardActor, privateHeaders} from '@/lib/business-cards/server';

export const dynamic = 'force-dynamic';
const BUCKET = 'lfx-card-media';
const LIMIT = 8 * 1024 * 1024;
const TYPES: Record<string, {ext: string; valid: (b: Buffer) => boolean}> = {
  'image/jpeg': {ext: 'jpg', valid: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff},
  'image/png': {ext: 'png', valid: b => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))},
  'image/webp': {ext: 'webp', valid: b => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'},
};

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const actor = await cardActor();
    requireCardWriter(actor);
    if (mode() === 'demo' || !configured()) throw new OperationError('Image uploads need the configured LayeredFX storage bucket. Paste a public https image URL instead.', 503);
    const type = TYPES[request.headers.get('content-type') || ''];
    if (!type) throw new OperationError('Use a JPEG, PNG or WebP image.', 415);
    if (Number(request.headers.get('content-length') || 0) > LIMIT) throw new OperationError('Images must be under 8 MB.', 413);
    const reader = request.body?.getReader();
    if (!reader) throw new OperationError('Choose an image.');
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > LIMIT) { await reader.cancel(); throw new OperationError('Images must be under 8 MB.', 413); }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    if (!size || !type.valid(bytes)) throw new OperationError('The file content does not match its image type.');
    const storage = createClient(process.env.LFX_SUPABASE_URL!, process.env.LFX_SUPABASE_SERVICE_ROLE_KEY!, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}}).storage.from(BUCKET);
    const path = `${process.env.LFX_OPERATIONS_ORG_ID}/${actor.id}/${crypto.randomUUID()}.${type.ext}`;
    const {error} = await storage.upload(path, bytes, {contentType: request.headers.get('content-type')!, upsert: false});
    if (error) throw new OperationError('Upload failed. Check the LayeredFX card media bucket.', 503);
    return Response.json({url: storage.getPublicUrl(path).data.publicUrl}, {status: 201, headers: privateHeaders});
  } catch (e) { return errorResponse(e); }
}
