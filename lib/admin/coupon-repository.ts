import 'server-only';
import {CouponError, type Coupon, type CouponFields} from './coupons';
import {isUuid} from '../operations/security.mjs';

const fields = 'id,code,description,discount_type,discount_value,min_order_total,max_uses,uses_count,expires_at,active,created_at,revision';
// Every query is scoped here; callers cannot provide a table or organization.
export function couponRepository() {
  const org = process.env.LFX_OPERATIONS_ORG_ID;
  const url = process.env.LFX_SUPABASE_URL;
  const key = process.env.LFX_SUPABASE_SERVICE_ROLE_KEY;
  if (!org || !isUuid(org) || !url || !key) throw new CouponError('LayeredFX coupon storage requires configuration.', 503);
  const origin = new URL(url);
  if (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:') throw new CouponError('LayeredFX storage requires HTTPS.',503);
  async function query(params: Record<string,string>, init: RequestInit = {}): Promise<Coupon[]> {
    const search = new URLSearchParams({...params, org_id:`eq.${org}`, select:fields});
    const response = await fetch(`${origin.origin}/rest/v1/lfx_coupons?${search}`, {
      ...init, cache:'no-store', signal:AbortSignal.timeout(12000),
      headers:{apikey:key!, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=representation'},
    });
    if (response.status === 409) throw new CouponError('That code already exists or the coupon is referenced by another record.',409);
    if (!response.ok) throw new CouponError('Coupon storage is unavailable. The LayeredFX coupon schema must be configured.',503);
    return response.json();
  }
  function idFilter(id:string) {
    if (!isUuid(id)) throw new CouponError('Invalid coupon ID.');
    return `eq.${id}`;
  }
  return {
    list: (offset:number, active?:string) => query({order:'created_at.desc,id.desc',limit:'100',offset:String(offset),...(active ? {active:`eq.${active}`} : {})}),
    get: async(id:string) => (await query({id:idFilter(id)}))[0],
    create: async(data:CouponFields, actorId:string) => (await query({}, {method:'POST',body:JSON.stringify({...data, org_id:org, changed_by:actorId})}))[0],
    update: async(id:string, revision:number, data:CouponFields, actorId:string) => {
      const rows = await query({id:idFilter(id),revision:`eq.${revision}`},{method:'PATCH',body:JSON.stringify({...data,revision:revision+1,changed_by:actorId})});
      if (!rows.length) throw new CouponError('This coupon changed. Reload before saving again.',409);
      return rows[0];
    },
    remove: async(id:string, revision:number) => {
      const rows = await query({id:idFilter(id),revision:`eq.${revision}`},{method:'DELETE'});
      if (!rows.length) throw new CouponError('This coupon changed. Reload before deleting.',409);
    },
  };
}
