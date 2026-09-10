import {currentActor, checkOrigin, errorResponse} from '@/lib/operations/server';
import {readBody} from '@/lib/operations/security.mjs';
import {CouponError, couponFields, couponRevision, requireCouponWriter} from '@/lib/admin/coupons';
import {couponRepository} from '@/lib/admin/coupon-repository';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control':'private, no-store', Vary:'Cookie'};
function failure(error:unknown) {
  return error instanceof CouponError ? Response.json({message:error.message},{status:error.status,headers}) : errorResponse(error);
}
export async function GET(request:Request) {
  try {
    await currentActor();
    const params = new URL(request.url).searchParams;
    const offset = Number(params.get('offset') || 0);
    const active = params.get('active') || undefined;
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000000 || (active && !['true','false'].includes(active))) throw new CouponError('Invalid page or status filter.');
    const coupons = await couponRepository().list(offset,active);
    return Response.json({coupons, nextOffset:coupons.length === 100 ? offset+100 : null},{headers});
  } catch(error) { return failure(error); }
}
async function mutate(request:Request) {
  try {
    checkOrigin(request);
    const actor = await currentActor();
    requireCouponWriter(actor.role);
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new CouponError('JSON is required.',415);
    let body:Record<string,unknown>;
    try { body = JSON.parse(await readBody(request,16000)); } catch(error) {
      if (error instanceof SyntaxError) throw new CouponError('Invalid JSON.');
      throw error;
    }
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new CouponError('A JSON object is required.');
    const repo = couponRepository();
    if (request.method === 'POST') {
      const coupon = await repo.create(couponFields(body),actor.id);
      return Response.json({coupon},{status:201,headers});
    }
    const revision = couponRevision(body);
    const id = String(body.id || '');
    const existing = await repo.get(id);
    if (!existing) throw new CouponError('Coupon not found.',404);
    if (existing.revision !== revision) throw new CouponError('This coupon changed. Reload before trying again.',409);
    if (request.method === 'DELETE') {
      if (existing.uses_count > 0) throw new CouponError('Deactivate a used coupon to preserve order history.',409);
      await repo.remove(id,revision);
      return Response.json({deleted:true},{headers});
    }
    const coupon = await repo.update(id,revision,couponFields(body,existing),actor.id);
    return Response.json({coupon},{headers});
  } catch(error) { return failure(error); }
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
